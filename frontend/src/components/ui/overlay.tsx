'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/stores/ui';
import { Button } from './button';
import { Field, Textarea } from './form';

function useLockScroll(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, children, footer, size = 'md', className }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  useLockScroll(open);
  useEsc(open, onClose);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('relative flex max-h-[92vh] w-full animate-fade-up flex-col rounded-t-3xl bg-white shadow-lift sm:rounded-3xl', w, className)}>
        {title && (
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h3 className="font-sans text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="cursor-pointer rounded-full p-1.5 text-muted hover:bg-sand-100" aria-label="Đóng">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, side = 'right', width = 'max-w-md' }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; side?: 'right' | 'left'; width?: string }) {
  useLockScroll(open);
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} />
      <aside className={cn('absolute top-0 flex h-full w-full flex-col bg-cream shadow-lift', width, side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-fade-in')}>
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <div className="font-sans text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="cursor-pointer rounded-full p-1.5 text-muted hover:bg-sand-100" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line bg-white p-5">{footer}</div>}
      </aside>
    </div>
  );
}

/** Renders the global confirm dialog requested through useUi().ask(). Remounted per request so its input starts empty. */
export function ConfirmHost() {
  const confirm = useUi((s) => s.confirm);
  return confirm ? <ConfirmDialog key={confirm.id} confirm={confirm} /> : null;
}

function ConfirmDialog({ confirm }: { confirm: NonNullable<ReturnType<typeof useUi.getState>['confirm']> }) {
  const close = useUi((s) => s.closeConfirm);
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = !!confirm.input?.required && !value.trim();
  return (
    <Modal open onClose={() => close({ ok: false })} size="sm">
      <div className="flex gap-4">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', confirm.tone === 'danger' ? 'bg-red-50 text-danger' : 'bg-forest-50 text-forest-600')}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-sans text-lg font-semibold">{confirm.title}</h3>
          {confirm.description && <p className="mt-1 text-sm text-muted">{confirm.description}</p>}
          {confirm.input && (
            <Field label={confirm.input.label} className="mt-4" error={touched && invalid ? 'Vui lòng nhập thông tin' : undefined} required={confirm.input.required}>
              <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={confirm.input.placeholder} autoFocus maxLength={300} />
            </Field>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => close({ ok: false })}>
          {confirm.cancelLabel || 'Hủy'}
        </Button>
        <Button
          variant={confirm.tone === 'danger' ? 'danger' : 'primary'}
          onClick={() => {
            setTouched(true);
            if (invalid) return;
            close({ ok: true, value: value.trim() });
          }}
        >
          {confirm.confirmLabel || 'Xác nhận'}
        </Button>
      </div>
    </Modal>
  );
}
