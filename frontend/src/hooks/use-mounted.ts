'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** false during server render and hydration, true afterwards – without a setState-in-effect. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Reads a sessionStorage value safely (null on the server). */
export function useSessionValue(key: string) {
  return useSyncExternalStore(
    noop,
    () => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
}
