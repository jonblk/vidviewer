import { useCallback, useState,} from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
 const [storedValue, setStoredValue] = useState<T>(() => {
   try {
     const item = window.localStorage.getItem(key);
     return item ? JSON.parse(item) as T : initialValue;
   } catch (error) {
     console.log(error);
     return initialValue;
   }
 });

 const setValue = useCallback((value: T | ((val: T) => T)) => {
   try {
     const valueToStore = value instanceof Function ? value(storedValue) : value;
     setStoredValue(valueToStore);
     window.localStorage.setItem(key, JSON.stringify(valueToStore));
   } catch (error) {
     console.log(error);
   }
 }, []);

 return [storedValue, setValue];
}
