import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <div className="font-display text-8xl font-bold text-forest-200">404</div>
      <h1 className="mt-4 text-3xl">Không tìm thấy trang</h1>
      <p className="mt-2 max-w-md text-muted">Trang bạn tìm có thể đã bị xóa hoặc đường dẫn không đúng.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-xl bg-forest-600 px-5 py-3 font-semibold text-white">Về trang chủ</Link>
        <Link href="/products" className="rounded-xl border border-line bg-white px-5 py-3 font-semibold">Xem sản phẩm</Link>
      </div>
    </div>
  );
}
