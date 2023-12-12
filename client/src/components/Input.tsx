import React from "react";
import { HiOutlineSearch } from "react-icons/hi";

interface InputProps {
  type: string;
  label: string;
  id: string;
  value: string;
  autoFocus?: boolean;
  transparent?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({ label, autoFocus, onFocus, onBlur, type, id, value, onChange, transparent=false, ...props }) => {
  const bg = transparent ? "bg-transparent" : "dark:bg-neutral-800"
  return (
    <div className="relative">
    <input
      aria-label={label}
      autoFocus={autoFocus}
      type={type}
      id={id}
      value={value}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={onChange}
      className={"text-black border focus:border-blue-500 dark:focus:border-blue-500 border-neutral-200 dark:border-neutral-700 dark:text-neutral-200  py-2 px-2 w-full leading-tight focus:outline-none focus:shadow-outline rounded " + bg}
      {...props}
    />
    {type === "search" && <div className="absolute right-3 top-[12px]">
      <HiOutlineSearch />
    </div>
    }
    </div>
  );
};

export default Input