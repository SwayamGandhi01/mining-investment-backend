"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import axios from "axios";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageItem {
  url: string;
  publicId: string;
  caption?: string;
  order?: number;
}

interface MultiImageUploadFieldProps {
  name: string;
  label?: string;
  folder?: string;
  helperText?: string;
}

export function MultiImageUploadField({
  name,
  label,
  folder = "general",
  helperText,
}: MultiImageUploadFieldProps) {
  const { control } = useFormContext();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (
    files: FileList,
    currentValues: ImageItem[] = [],
    onChange: (val: ImageItem[]) => void
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      formData.append("folder", folder);

      const res = await axios.post("/api/upload/multiple", formData);
      if (res.data.success) {
        onChange([...currentValues, ...res.data.data]);
        toast.success("Images uploaded successfully");
      }
    } catch {
      toast.error("Failed to upload images");
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
        render={({ field, fieldState: { error } }) => {
          const images: ImageItem[] = field.value || [];

          return (
            <div className="space-y-3">
              {/* Existing Images Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.publicId || idx}
                      className="relative h-28 border border-border rounded-lg overflow-hidden group"
                    >
                      <Image
                        src={img.url}
                        alt={`Image ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          field.onChange(images.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 p-1 bg-danger-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Dropzone */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-card hover:bg-card-hover transition-colors">
                <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center px-4">
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin text-primary-500 mb-1" />
                  ) : (
                    <Upload size={24} className="text-muted mb-1" />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {uploading ? "Uploading..." : "Click to add multiple images"}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleUpload(e.target.files, images, field.onChange);
                    }
                  }}
                />
              </label>

              {error ? (
                <p className="text-xs text-danger-500 font-medium">{error.message}</p>
              ) : helperText ? (
                <p className="text-xs text-muted">{helperText}</p>
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
}
