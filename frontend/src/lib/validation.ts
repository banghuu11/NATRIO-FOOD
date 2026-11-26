import { z } from 'zod';

export const passwordRule = z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(64).regex(/[A-Za-z]/, 'Mật khẩu cần có chữ cái').regex(/\d/, 'Mật khẩu cần có chữ số');

/** Only same-site relative paths are allowed as redirect targets (prevents open redirects). */
export const safeNext = (n: string | null, fallback = '/') => (n && n.startsWith('/') && !n.startsWith('//') ? n : fallback);
