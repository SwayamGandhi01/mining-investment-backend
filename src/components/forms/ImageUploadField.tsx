"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import axios from "axios";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadFieldProps {
  name: string;
  label?: string;
  folder?: string;
  helperText?: string;
}

export function ImageUploadField({
  name,
  label,
  folder = "general",
  helperText,
}: ImageUploadFieldProps) {
  const { control } = useFormContext();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (
    file: File,
    onChange: (val: { url: string; publicId: string } | null) => void
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await axios.post("/api/upload", formData);
      if (res.data.success) {
        onChange(res.data.data);
        toast.success("Image uploaded successfully");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            {field.value?.url ? (
              <div className="relative w-full h-48 border border-border rounded-lg overflow-hidden group">
                <Image
                  src={field.value.url}
                  alt="Uploaded image"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => field.onChange(null)}
                  className="absolute top-2 right-2 p-1.5 bg-danger-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-md"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-card hover:bg-card-hover transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  {uploading ? (
                    <Loader2 size={32} className="animate-spin text-primary-500 mb-2" />
                  ) : (
                    <Upload size={32} className="text-muted mb-2" />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {uploading ? "Uploading..." : "Click to upload image"}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    PNG, JPG, WEBP, GIF up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, field.onChange);
                  }}
                />
              </label>
            )}
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
