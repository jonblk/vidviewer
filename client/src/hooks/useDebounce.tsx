import { useEffect } from "react";

export default function useDebounce<T>(val: T, callback: (v: T)=>void, delay: number) {
  useEffect(() => {
    const timer = setTimeout(
      () => {
        console.log("Calling debounce callback");
        callback(val);
      }, 
      delay
    );

    return () => {
      clearTimeout(timer);
    };
  }, [val, delay, callback]);
}