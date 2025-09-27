
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children?: React.ReactNode;
  className?: string;
  options?: Array<{ value: string; label: string }>;
}

const Select: React.FC<SelectProps> = ({ children, className = '', options, ...props }) => {
  return (
    <select
      className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {options ? options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )) : children}
    </select>
  );
};

export default Select;
