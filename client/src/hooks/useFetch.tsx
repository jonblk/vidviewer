import { useState, useEffect } from 'react';

const useFetch = <T,>(url: string, method: string="GET", initialFetch: boolean=true, skip: boolean=false): { data: T | null; loading: boolean; error: Error | null, fetch: (url: string) => void } => {
 const [data, setData] = useState<T | null>(null);
 const [loading, setLoading] = useState<boolean>(false);
 const [error, setError] = useState<Error | null>(null);
 
  const fetchData = async (url: string) => {
    if (skip) {
      return {data: [], loading: false, error: null}
    }
    console.log(method)
    
    try {
      setLoading(true);
      const response = await fetch(url, { method: method });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: T = await response.json();
      setData(data);
      setLoading(false);
    } catch (error) {
      setError(error as Error);
      setLoading(false);
    }
  };

 useEffect(() => {
  if (initialFetch) {
    fetchData(url);
  }
 }, [url, initialFetch]);

 return { data, loading, error, fetch: fetchData };
};

export default useFetch;
