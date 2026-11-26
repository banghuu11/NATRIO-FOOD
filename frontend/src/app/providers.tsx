'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { setUnauthorizedHandler } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { usePrefs } from '@/stores/prefs';
import { ConfirmHost } from '@/components/ui/overlay';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  const init = useAuth((s) => s.init);

  useEffect(() => {
    usePrefs.persist.rehydrate();
    init();
    setUnauthorizedHandler(() => {
      useAuth.setState({ user: null });
      client.invalidateQueries();
    });
  }, [init, client]);

  return (
    <QueryClientProvider client={client}>
      {children}
      <ConfirmHost />
      <Toaster position="top-center" richColors closeButton toastOptions={{ className: 'font-sans' }} />
    </QueryClientProvider>
  );
}
