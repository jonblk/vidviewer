import React from "react";

interface LabelProps {
  htmlFor: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const Label: React.FC<LabelProps> = ({ disabled, htmlFor, children }) => {
  return (
    <label htmlFor={htmlFor} className={"dark:text-neutral-500 text-neutral-500 block mb-0.5 " + (disabled ? "opacity-30": "")}>
      {children}
    </label>
  );
};

export default Label;