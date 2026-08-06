"use client";

import dynamic from "next/dynamic";
import { useFormContext, Controller } from "react-hook-form";
import { Loader2 } from "lucide-react";

/**
 * CKEditor cannot be server-rendered — it touches browser globals at import time,
 * and Next only permits `ssr: false` inside a Client Component, which this is.
 */
const CKEditorClient = dynamic(() => import("./CKEditorClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 h-48 px-3.5 bg-card border border-border rounded-lg text-sm text-muted">
      <Loader2 size={16} className="animate-spin" />
      Loading editor…
    </div>
  ),
});

interface RichTextEditorFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Rich text editor bound to react-hook-form. Stores HTML in the form field, so it
 * is a drop-in replacement for the plain-textarea RichTextField.
 */
export function RichTextEditorField({
  name,
  label,
  helperText,
  placeholder,
  required,
}: RichTextEditorFieldProps) {
  const { control } = useFormContext();

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            <div
              className={
                error
                  ? "ck-field ck-field-error rounded-lg"
                  : "ck-field rounded-lg"
              }
            >
              <CKEditorClient
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={placeholder}
              />
            </div>
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
