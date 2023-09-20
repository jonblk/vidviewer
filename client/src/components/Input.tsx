import React from "react";
import { HiOutlineSearch } from "react-icons/hi";

interface InputProps {
  type: string;
  label: string;
  id: string;
  value: string;
  transparent?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({ label, onFocus, onBlur, type, id, value, onChange, transparent=false }) => {
  const bg = transparent ? "bg-transparent" : "dark:bg-neutral-700"
  return (
    <div className="relative">
    <input
      aria-label={label}
      autoFocus
      type={type}
      id={id}
      value={value}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={onChange}
      className={"text-black border border-neutral-200 dark:border-neutral-700 dark:text-neutral-200  py-2 px-2 w-full leading-tight focus:outline-none focus:shadow-outline rounded " + bg}
    />
    {type === "search" && <div className="absolute right-3 top-[12px]">
      <HiOutlineSearch />
    </div>
    }
    </div>
  );
};

export default Input