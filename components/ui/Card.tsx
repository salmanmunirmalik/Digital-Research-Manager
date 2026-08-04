import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  /** Used by deep-link scroll/highlight */
  'data-entity-id'?: string;
};

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  'data-entity-id': dataEntityId,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className}`}
      onClick={onClick}
      data-entity-id={dataEntityId}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-slate-200 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-slate-800 ${className}`}>{children}</h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className = '' }) => (
  <p className={`text-sm text-slate-500 mt-1 ${className}`}>{children}</p>
);

export default Card;
