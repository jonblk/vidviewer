import { useEffect } from "react";

function useKeyDownListener(condition: boolean, key: string, callback: () => void) {
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === key) {
        if (condition) {
          callback();
        }
        event.stopPropagation();
      }
    }

    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [condition]);
}

export {useKeyDownListener}