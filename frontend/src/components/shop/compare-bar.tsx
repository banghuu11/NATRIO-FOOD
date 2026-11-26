'use client';

import { usePathname } from 'next/navigation';
import { Scale, X } from 'lucide-react';
import { usePrefs } from '@/stores/prefs';
import { ButtonLink } from '@/components/ui/button';
import { SmartImage } from '@/components/ui/misc';

export function CompareBar() {
  const { compare, removeCompare, clearCompare } = usePrefs();
  const pathname = usePathname();
  if (!compare.length || pathname === '/compare') return null;
  return (
    <div className="no-print fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-2xl animate-fade-up items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-lift">
        <Scale className="hidden h-5 w-5 text-forest-600 sm:block" />
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {compare.map((p) => (
            <div key={p.id} className="relative shrink-0">
              <SmartImage src={p.image} alt={p.name} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
              <button onClick={() => removeCompare(p.id)} className="absolute -top-1.5 -right-1.5 cursor-pointer rounded-full bg-ink p-0.5 text-white" aria-label={`Bỏ ${p.name}`}><X className="h-3 w-3" /></button>
            </div>
          ))}
          {Array.from({ length: 3 - compare.length }).map((_, i) => <div key={i} className="h-12 w-12 shrink-0 rounded-lg border border-dashed border-sand-300" />)}
        </div>
        <button onClick={clearCompare} className="cursor-pointer text-xs text-muted hover:text-danger">Xóa</button>
        <ButtonLink href="/compare" size="sm">So sánh ({compare.length})</ButtonLink>
      </div>
    </div>
  );
}
