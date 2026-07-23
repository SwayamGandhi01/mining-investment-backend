"use client";

import { useFormContext, Controller } from "react-hook-form";
import StatusToggle from "@/components/common/StatusToggle";

interface ToggleFieldProps {
  name: string;
  label?: string;
  helperText?: string;
}

export function ToggleField({ name, label, helperText }: ToggleFieldProps) {
  const { control } = useFormContext();

  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
      <div>
        {label && <p className="text-sm font-medium text-foreground">{label}</p>}
        {helperText && <p className="text-xs text-muted">{helperText}</p>}
      </div>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <StatusToggle
            checked={Boolean(field.value)}
            onChange={(val) => field.onChange(val)}
          />
        )}
      />
    </div>
  );
}
