import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "up" | "down";
}

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-sm border";
  
  const variants = {
    default: "bg-paper text-ink border-hairline",
    up: "bg-data-up/10 text-data-up border-data-up/20",
    down: "bg-data-down/10 text-data-down border-data-down/20",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
}
