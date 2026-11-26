import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Centralised error handler. Every error leaves the API as:
 *   { statusCode, message, errors? }
 * Internal details (stack, SQL) are logged, never sent to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const req = host.switchToHttp().getRequest();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã có lỗi xảy ra, vui lòng thử lại sau';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as any;
      if (typeof body === 'string') message = body;
      else if (Array.isArray(body?.message)) {
        errors = body.message;
        message = body.message[0] || 'Dữ liệu không hợp lệ';
      } else if (body?.message) message = body.message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Dữ liệu đã tồn tại (trùng giá trị duy nhất)';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Không tìm thấy dữ liệu';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.CONFLICT;
        message = 'Không thể thực hiện vì dữ liệu đang được sử dụng ở nơi khác';
      } else {
        this.logger.error(`${exception.code} ${exception.message}`);
      }
    } else if (exception instanceof Prisma.PrismaClientUnknownRequestError || exception instanceof Error) {
      // Business errors raised from PL/pgSQL functions (RAISE EXCEPTION) – e.g. out of stock.
      const msg = (exception as Error).message || '';
      const m = msg.match(/Không đủ tồn kho[^"\n]*/);
      if (m) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Một số sản phẩm không đủ tồn kho, vui lòng cập nhật giỏ hàng';
      } else {
        this.logger.error(`${req?.method} ${req?.url} → ${msg}`, (exception as Error).stack);
      }
    }

    res.status(status).json({ statusCode: status, message, ...(errors && errors.length > 1 ? { errors } : {}) });
  }
}
