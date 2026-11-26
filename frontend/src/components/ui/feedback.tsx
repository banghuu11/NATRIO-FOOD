import type { ReactNode } from 'react';
import { AlertTriangle, Loader2, PackageOpen, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-10 text-muted', className)} role="status">
      <Loader2 className="h-5 w-5 animate-spin text-forest-500" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-white/60 px-6 py-14 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-100 text-latte-500">{icon ?? <PackageOpen className="h-8 w-8" />}</div>
      <h3 className="font-sans text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-danger/20 bg-danger/5 px-6 py-12 text-center', className)} role="alert">
      <AlertTriangle className="mb-3 h-8 w-8 text-danger" />
      <p className="font-medium text-ink">Không tải được dữ liệu</p>
      <p className="mt-1 max-w-md text-sm text-muted">{message || 'Vui lòng kiểm tra kết nối và thử lại.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Thử lại
        </Button>
      )}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-3 h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Notice({ tone = 'info', children, className, icon }: { tone?: 'info' | 'warning' | 'danger' | 'success'; children: ReactNode; className?: string; icon?: ReactNode }) {
  const tones = {
    info: 'bg-forest-50 text-forest-800 border-forest-100',
    success: 'bg-forest-50 text-forest-800 border-forest-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
  };
  return <div className={cn('flex gap-2.5 rounded-xl border px-4 py-3 text-sm', tones[tone], className)}>{icon}<div className="min-w-0 flex-1">{children}</div></div>;
}
