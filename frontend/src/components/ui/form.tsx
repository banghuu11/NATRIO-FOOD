import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-muted/70 transition focus:outline-none focus:ring-4 disabled:bg-sand-50 disabled:text-muted';
const state = (error?: string) => (error ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-line focus:border-forest-400 focus:ring-forest-100');

export function Field({ label, error, hint, required, children, className }: { label?: string; error?: string; hint?: ReactNode; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink/90">
          {label} {required && <span className="text-danger">*</span>}
        </span>
      )}
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: string; leftIcon?: ReactNode; rightSlot?: ReactNode }>(
  ({ className, error, leftIcon, rightSlot, ...props }, ref) => (
    <div className="relative">
      {leftIcon && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">{leftIcon}</span>}
      <input ref={ref} aria-invalid={!!error} className={cn(base, state(error), 'h-11', leftIcon && 'pl-10', rightSlot && 'pr-11', className)} {...props} />
      {rightSlot && <span className="absolute top-1/2 right-2 -translate-y-1/2">{rightSlot}</span>}
    </div>
  ),
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: string }>(({ className, error, children, ...props }, ref) => (
  <select ref={ref} aria-invalid={!!error} className={cn(base, state(error), 'h-11 cursor-pointer appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2366705f%27 stroke-width=%272%27><path d=%27m6 9 6 6 6-6%27/></svg>")] bg-[length:14px] bg-[right_12px_center] bg-no-repeat pr-9', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(({ className, error, ...props }, ref) => (
  <textarea ref={ref} aria-invalid={!!error} className={cn(base, state(error), 'min-h-24 py-2.5', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export function Checkbox({ checked, onChange, label, description, className, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; className?: string; disabled?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 select-none', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition',
          checked ? 'border-forest-600 bg-forest-600 text-white' : 'border-sand-300 bg-white',
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">
        <span className="text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <span className={cn('relative h-6 w-11 rounded-full transition', checked ? 'bg-forest-600' : 'bg-sand-200')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
      {label}
    </button>
  );
}

/** Pill-style single/multi chooser. */
export function ChipGroup<T extends string>({ options, value, onChange, multiple = false, className }: { options: { value: T; label: ReactNode }[]; value: T[] | T | null; onChange: (v: never) => void; multiple?: boolean; className?: string }) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  // Callers pass a setter for either T[] (multiple) or T | null (single)
  const emit = onChange as (v: T[] | T | null) => void;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => (multiple ? emit(on ? selected.filter((x) => x !== o.value) : [...selected, o.value]) : emit(on ? null : o.value))}
            className={cn(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition',
              on ? 'border-forest-600 bg-forest-600 text-white' : 'border-line bg-white text-ink/80 hover:border-forest-300 hover:text-forest-700',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
