import { useState, useEffect } from 'react';

export const useDarkMode = (): [boolean, () => void] => {
  const [darkMode, setDarkMode] =  useState<boolean>(localStorage.getItem('darkMode') === 'true');

  const toggleDarkMode = () => {
    const updatedMode = !darkMode;
    setDarkMode(updatedMode);
    localStorage.setItem('darkMode', String(updatedMode));
  };

  useEffect(() => {
    const body = document.body;
    if (darkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, [darkMode]);

  return [darkMode, toggleDarkMode];
};