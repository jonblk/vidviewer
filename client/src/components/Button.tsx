import React from "react";

interface ButtonProps {
  onClick: (event: React.FormEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
  type: "button" | "submit" | "reset" | undefined;
  color: "primary" | "neutral" | "danger"
}

const Button: React.FC<ButtonProps> = ({ onClick, type, disabled, children, color, ...props}) => {
  let c = "bg-blue-500 hover:bg-blue-700 text-white";
  switch(color) {
    case("primary"):
      c = "bg-blue-600 hover:bg-blue-500 text-white active:bg-blue-400";
      break;
    case("neutral"):
      c = "bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-200";
      break;
    case("danger"):
      c = "bg-red-500 hover:bg-red-600 text-white";
      break;
  }
  return (
    <button
      type={type}
      className={c + " py-2 px-4 w-full rounded flex items-center justify-center"}
      onClick={onClick}
      disabled={!!disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;