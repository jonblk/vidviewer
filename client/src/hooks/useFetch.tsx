import { useState, useEffect } from 'react';

const useFetch = <T,>(url: string, skip: boolean=false): { data: T | null; loading: boolean; error: Error | null } => {
 const [data, setData] = useState<T | null>(null);
 const [loading, setLoading] = useState<boolean>(false);
 const [error, setError] = useState<Error | null>(null);
 
 useEffect(() => {
  const fetchData = async () => {
    if (skip) {
      return {data: [], loading: false, error: null}
    }
    
    try {
      setLoading(true);
      const response = await fetch(url);
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

  fetchData();
 }, [url]);

 return { data, loading, error };
};

export default useFetch;
