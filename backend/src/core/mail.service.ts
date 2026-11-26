import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Sends email through SMTP when SMTP_HOST is configured.
 * Without SMTP the message is only logged (development / demo mode).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(config.get('SMTP_PORT') || 587),
        secure: Number(config.get('SMTP_PORT')) === 465,
        auth: { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') },
      });
    }
  }

  get enabled() {
    return !!this.transporter;
  }

  async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[SMTP chưa cấu hình] Bỏ qua gửi email tới ${to}: "${subject}"`);
      return false;
    }
    try {
      await this.transporter.sendMail({ from: this.config.get('SMTP_FROM') || 'NUTRIO <no-reply@nutrio.vn>', to, subject, html });
      return true;
    } catch (e) {
      this.logger.error(`Gửi email thất bại tới ${to}: ${(e as Error).message}`);
      return false;
    }
  }

  /** Minimal branded layout for transactional emails. */
  layout(title: string, body: string) {
    return `<div style="font-family:Arial,sans-serif;background:#f7f3ec;padding:24px">
      <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#2f5d3a;color:#fff;padding:16px 24px;font-size:20px;font-weight:bold">NUTRIO</div>
        <div style="padding:24px;color:#2c3e30;line-height:1.6"><h2 style="margin-top:0">${title}</h2>${body}</div>
        <div style="padding:12px 24px;font-size:12px;color:#888;border-top:1px solid #eee">NUTRIO Food – Dinh dưỡng chuẩn cho mỗi ngày</div>
      </div></div>`;
  }
}
