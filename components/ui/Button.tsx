
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'default' | 'sm';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'default', className = '', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

        const variants = {
          primary: 'bg-slate-800 text-white hover:bg-slate-700',
          secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
          ghost: 'hover:bg-slate-200',
          outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
        };

  const sizes = {
    default: 'px-4 py-2',
    sm: 'h-9 px-3',
  };

  return (
    <button className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
