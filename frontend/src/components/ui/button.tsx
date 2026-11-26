import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-forest-600 text-white hover:bg-forest-700 shadow-sm active:bg-forest-800',
  secondary: 'bg-forest-50 text-forest-700 hover:bg-forest-100',
  outline: 'border border-line bg-white text-ink hover:border-forest-400 hover:text-forest-700',
  ghost: 'text-ink/80 hover:bg-sand-100 hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger/90',
  accent: 'bg-latte-500 text-white hover:bg-latte-600 shadow-sm',
  link: 'text-forest-600 underline-offset-4 hover:underline px-0 h-auto',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-13 px-7 text-base rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-full',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cn(
    'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
    variants[variant],
    sizes[size],
    className,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
  <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
));
Button.displayName = 'Button';

export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
