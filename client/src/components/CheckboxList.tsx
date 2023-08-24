import React, { useState } from 'react';
import { Playlist } from '../App';

interface CheckboxOption<T> {
  label: string;
  value: T;
  checked: boolean;
}

interface CheckboxListProps<T> {
  options: CheckboxOption<T>[];
  onSelectionChange: (v: T, isChecked: boolean) => void;
}

const CheckboxList = <T,>({ options, onSelectionChange }: CheckboxListProps<T>) => {
  return (
    <div className="flex flex-col max-h-32 overflow-auto">
      {options.map((option, index) => (
        <label key={index} className="inline-flex items-center mt-3">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-green-600"
            checked={option.checked}
            onChange={(e) => onSelectionChange(option.value, e.target.checked)}
          />
          <span className="ml-2 text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );
};

export default CheckboxList;