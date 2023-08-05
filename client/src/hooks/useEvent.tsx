import { useCallback, useInsertionEffect, useRef } from "react";

export function useEvent(fn: (...args: any[]) => any): (...args: any[]) => any {
  const ref = useRef<(...args: any[]) => any>();
  useInsertionEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args: any[]) => {
    const f = ref.current;
    if (f) {
      return f(...args);
    }
  }, []);
}