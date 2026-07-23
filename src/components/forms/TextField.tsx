"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function TextField({
  name,
  label,
  helperText,
  icon,
  className,
  ...props
}: TextFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-foreground">
          {label} {props.required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
        <input
          id={name}
          {...register(name)}
          {...props}
          className={cn(
            "w-full bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors py-2.5 px-3.5",
            icon && "pl-10",
            error && "border-danger-500 focus:ring-danger-500",
            className
          )}
        />
      </div>
      {error ? (
        <p className="text-xs text-danger-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
