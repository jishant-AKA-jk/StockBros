import React from 'react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const baseClass = "px-4 py-2 rounded font-medium text-sm transition-colors";
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover",
      secondary: "bg-surface border border-hairline text-ink hover:bg-paper",
      danger: "bg-data-down text-white opacity-90 hover:opacity-100",
    };
    return <button ref={ref} className={`${baseClass} ${variants[variant]} ${className}`} {...props} />;
  }
);
Button.displayName = 'Button';

export const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-surface rounded-lg shadow-card border border-hairline overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const Badge = ({ className = '', children, variant = 'default' }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' }) => {
  const variants = {
    default: "bg-paper border border-hairline text-ink",
    success: "bg-data-up/10 text-data-up border border-data-up/20",
    warning: "bg-signature/10 text-signature border border-signature/20",
    danger: "bg-data-down/10 text-data-down border border-data-down/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`block w-full rounded-md border-hairline bg-surface text-ink shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const EyebrowLabel = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={`block text-xs font-semibold text-ink-light uppercase tracking-wider ${className}`} {...props}>
    {children}
  </span>
);
