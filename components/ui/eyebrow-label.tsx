import React from "react";

type EyebrowLabelProps = React.HTMLAttributes<HTMLParagraphElement>;

export function EyebrowLabel({ className = "", ...props }: EyebrowLabelProps) {
  // Ledger column header feel: uppercase, small, widely tracked, muted
  return (
    <p 
      className={`text-[0.65rem] font-bold tracking-widest uppercase text-ink-light ${className}`} 
      {...props} 
    />
  );
}
