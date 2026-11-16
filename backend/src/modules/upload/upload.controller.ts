import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/i)) {
      return cb(
        new BadRequestException('Định dạng tệp không hợp lệ! Chỉ chấp nhận JPG, JPEG, PNG, WEBP, GIF, SVG.'),
        false,
      );
    }
    cb(null, true);
  },
};

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  @Post('single')
  @ApiOperation({ summary: 'Tải lên 1 ảnh duy nhất (Avatar, Banner, Thumbnail)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp ảnh để tải lên');
    }

    const host = process.env.API_URL || 'http://localhost:5001';
    const relativeUrl = `/uploads/${file.filename}`;
    const fullUrl = `${host}${relativeUrl}`;

    return {
      message: 'Tải ảnh lên thành công!',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: fullUrl,
      relativeUrl,
    };
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Tải lên nhiều ảnh cùng lúc (Tối đa 10 ảnh cho sản phẩm)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một tệp ảnh để tải lên');
    }

    const host = process.env.API_URL || 'http://localhost:5001';
    const uploaded = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `${host}/uploads/${file.filename}`,
      relativeUrl: `/uploads/${file.filename}`,
    }));

    return {
      message: `Đã tải lên thành công ${files.length} ảnh!`,
      urls: uploaded.map((item) => item.url),
      files: uploaded,
    };
  }
}
