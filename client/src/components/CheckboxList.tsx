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
    <div className="flex flex-col">
      {options.map((option, index) => (
        <div onClick={ () => {onSelectionChange(option.value, !option.checked)} }data-testid={`checkbox-toggle-${option.label}`} key={index} className="inline-flex items-center ">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5"
            checked={option.checked}
          />
          <span className="ml-2 dark:text-neutral-300">{option.label}</span>
        </div>
      ))}
    </div>
  );
};

export default CheckboxList;