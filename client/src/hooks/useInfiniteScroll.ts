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
  callback: () => void,
  offset = 10
): [number,  React.Dispatch<React.SetStateAction<number>>, boolean, React.Dispatch<React.SetStateAction<boolean>>, React.Dispatch<React.SetStateAction<boolean>>,RefObject<HTMLDivElement>] => {
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true)
  const [position, setPosition] = useState(0)

  const scrollTriggerRef = useRef<HTMLDivElement>(null);

  // On Position change callback
  
  const handleScroll = useCallback(() => {
    setPosition(window.scrollY)

    if (
      scrollTriggerRef.current &&
      window.innerHeight + window.scrollY >=
        scrollTriggerRef.current.offsetTop - offset &&
      !isFetching
      && hasMore
    ) {
      callback();
    }
  }, [setPosition, isFetching, callback, offset, hasMore]);

  // Add scroll listener to window
  useEffect(() => {
    const throttledCallback = throttle(handleScroll, 200)
    window.addEventListener('scroll', throttledCallback);
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [handleScroll]);

  return [position, setPosition, isFetching, setIsFetching, setHasMore, scrollTriggerRef];
};