import { useEffect, useState, useRef, useCallback, RefObject } from 'react';

const throttle = <F extends (...args: any[]) => any>(func: F, delay: number): ((...args: Parameters<F>) => void) => {
  let timerId: NodeJS.Timeout | undefined;
  return (...args: Parameters<F>) => {
    if (!timerId) {
      timerId = setTimeout(() => {
        func(...args);
        timerId = undefined;
      }, delay);
    }
  };
};

export const useInfiniteScroll = (
  onTrigger: () => void,
  offset = 10,
  isEnabled = true,
  initialPosition = 0,
): [number, RefObject<HTMLDivElement>] => {
  const [position, setPosition] = useState(initialPosition)
  const scrollTriggerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    setPosition(window.scrollY)

    if (
      scrollTriggerRef.current &&
      window.innerHeight + window.scrollY >=
        scrollTriggerRef.current.offsetTop - offset &&
      isEnabled
    ) {
      onTrigger();
    }
  }, [setPosition, onTrigger, offset]);

  // Add scroll listener to window
  useEffect(() => {
    const throttledCallback = throttle(handleScroll, 200)
    window.addEventListener('scroll', throttledCallback);
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [handleScroll]);

  return [position, scrollTriggerRef];
};