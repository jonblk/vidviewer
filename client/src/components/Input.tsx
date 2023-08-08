import React from "react";

interface InputProps {
  type: string;
  label: string;
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({ label, onFocus, onBlur, type, id, value, onChange }) => {
  return (
    <input
      aria-label={label}
      autoFocus
      type={type}
      id={id}
      value={value}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={onChange}
      className="border border-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600 rounded py-2 px-2 w-full  leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-blue-400 "
    
    />
  );
};

export default Input;