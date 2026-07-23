"use client";

import { useFormContext, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectFieldProps {
  name: string;
  label?: string;
  options: Option[];
  helperText?: string;
}

export function MultiSelectField({
  name,
  label,
  options,
  helperText,
}: MultiSelectFieldProps) {
  const { control } = useFormContext();

  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => {
          const selectedValues: string[] = field.value || [];

          const toggleValue = (val: string) => {
            if (selectedValues.includes(val)) {
              field.onChange(selectedValues.filter((v) => v !== val));
            } else {
              field.onChange([...selectedValues, val]);
            }
          };

          return (
            <div>
              <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-card max-h-48 overflow-y-auto">
                {options.map((opt) => {
                  const isSelected = selectedValues.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleValue(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        isSelected
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-card-hover text-muted border-border hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {error ? (
                <p className="text-xs text-danger-500 font-medium mt-1">
                  {error.message}
                </p>
              ) : helperText ? (
                <p className="text-xs text-muted mt-1">{helperText}</p>
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
}
