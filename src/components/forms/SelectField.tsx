"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label?: string;
  options: { label: string; value: string | number }[];
  helperText?: string;
}

export function SelectField({
  name,
  label,
  options,
  helperText,
  className,
  ...props
}: SelectFieldProps) {
  const {
    control,
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
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            id={name}
            {...field}
            {...props}
            className={cn(
              "w-full bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors py-2.5 px-3.5",
              error && "border-danger-500 focus:ring-danger-500",
              className
            )}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      />
      {error ? (
        <p className="text-xs text-danger-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
