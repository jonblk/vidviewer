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
): [boolean, React.Dispatch<React.SetStateAction<boolean>>, React.Dispatch<React.SetStateAction<boolean>>,RefObject<HTMLDivElement>] => {
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true)

  const scrollTriggerRef = useRef<HTMLDivElement>(null);

  // Set loading 
  const handleScroll = useCallback(() => {
    if (
      scrollTriggerRef.current &&
      window.innerHeight + window.pageYOffset >=
        scrollTriggerRef.current.offsetTop - offset &&
      !isFetching
      && hasMore
    ) {
      callback();
    }
  }, [isFetching, callback, offset, hasMore]);

  // Add scroll listener to window
  useEffect(() => {
    const throttledCallback = throttle(handleScroll, 200)
    window.addEventListener('scroll', throttledCallback);
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [handleScroll]);

  return [isFetching, setIsFetching, setHasMore, scrollTriggerRef];
};