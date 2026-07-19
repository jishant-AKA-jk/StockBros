import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function Card({ className = "", noPadding = false, ...props }: CardProps) {
  // Ledger card: slight border, solid surface color, subtle shadow on hover
  return (
    <div 
      className={`bg-surface border border-hairline rounded-sm transition-shadow duration-200 hover:shadow-card-hover ${noPadding ? "" : "p-4 md:p-6"} ${className}`} 
      {...props} 
    />
  );
}
