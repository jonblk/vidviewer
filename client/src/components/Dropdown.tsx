import React, { useState, useEffect, useRef } from "react";
import { HiChevronDown } from "react-icons/hi";
import Spinner from "./Spinner";

export interface Option {
  value: string | number;
  label: string;
}

interface DropdownProps {
  id?: string
  options: Option[];
  disabled: boolean;
  isFetching: boolean;
  onSelect: (selectedOption: Option) => void;
  selected?: Option | undefined
}

const Dropdown: React.FC<DropdownProps> = ({ options, disabled, onSelect, isFetching, selected, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(selected);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

   useEffect(() => {
    setSelectedOption(selected);
  }, [selected]);

  const handleSelectOption = (option: Option) => {
    setSelectedOption(option);
    onSelect(option);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <div>
        <button
          data-testid={`dropdown-button-${id}`}
          disabled={disabled}
          type="button"
          className="flex items-center justify-between w-full px-2 py-2 text-sm dark:text-neutral-200 bg-white dark:bg-neutral-800 dark:border-neutral-700 border border-neutral-200 rounded-md shadow-sm hover:bg-neutral-100 focus:outline-none "
          onClick={handleToggleDropdown}
        >
          { !disabled && !isFetching  ?
          <>
          {selectedOption ? (
            <span className="">{selectedOption.label}</span>
          ) : (
            <span className="text-neutral-400">Select an option</span>
          )
}
          <HiChevronDown className={`ml-2 transition-transform ${isOpen ? "transform rotate-180" : ""}`} />
         </>
          :

          isFetching ? <Spinner /> : <span>&nbsp; </span>
          }
        </button>
      </div>
      {isOpen && (
        <div id={id} className="z-10 absolute right-0 w-full mt-2 origin-top-right bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded-md shadow-lg max-h-40 overflow-y-auto">
          <div className="py-1">
            {options.map((option, i) => (
              <button
                data-testid={`option-${id}-${option.label}`}
                key={i}
                type="button"
                className="block w-full px-4 py-2 text-sm text-left dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200"
                onClick={() => handleSelectOption(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;