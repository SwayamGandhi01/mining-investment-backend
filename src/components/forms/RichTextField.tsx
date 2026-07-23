"use client";

import { useFormContext, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

interface RichTextFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
}

export function RichTextField({
  name,
  label,
  helperText,
  placeholder,
}: RichTextFieldProps) {
  const { control } = useFormContext();

  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            <textarea
              {...field}
              rows={8}
              placeholder={placeholder || "Write content here (HTML/Markdown supported)..."}
              className={cn(
                "w-full bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors py-2.5 px-3.5 font-mono",
                error && "border-danger-500 focus:ring-danger-500"
              )}
            />
            {error ? (
              <p className="text-xs text-danger-500 font-medium mt-1">
                {error.message}
              </p>
            ) : helperText ? (
              <p className="text-xs text-muted mt-1">{helperText}</p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
