import { BadRequestException, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';

export const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : join(process.cwd(), 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * Image upload for signed-in users (avatars, review photos, admin product images).
 * Files are stored on local disk in backend/uploads and served at /uploads/*.
 */
@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@Controller('uploads')
export class UploadsController {
  constructor(private config: ConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Tải lên tối đa 8 ảnh (jpg, png, webp, gif – tối đa 5MB/ảnh)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 8, {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = ALLOWED.includes(extname(file.originalname).toLowerCase()) && file.mimetype.startsWith('image/');
        cb(ok ? null : new BadRequestException('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'), ok);
      },
    }),
  )
  upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('Vui lòng chọn ảnh để tải lên');
    const base = (this.config.get<string>('PUBLIC_API_URL') || `http://localhost:${process.env.PORT || 5001}`).replace(/\/$/, '');
    return { urls: files.map((f) => `${base}/uploads/${f.filename}`) };
  }
}
