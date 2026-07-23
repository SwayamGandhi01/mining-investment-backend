"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  helperText?: string;
}

export function TextareaField({
  name,
  label,
  helperText,
  className,
  rows = 4,
  ...props
}: TextareaFieldProps) {
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
      <textarea
        id={name}
        rows={rows}
        {...register(name)}
        {...props}
        className={cn(
          "w-full bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors py-2.5 px-3.5 resize-y",
          error && "border-danger-500 focus:ring-danger-500",
          className
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
