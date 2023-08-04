import React from "react";

interface InputProps {
  type: string;
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({ type, id, value, onChange }) => {
  return (
    <input
      autoFocus
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      className="border border-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600 rounded py-2 px-2 w-full  leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-blue-400 "
    
    />
  );
};

export default Input;