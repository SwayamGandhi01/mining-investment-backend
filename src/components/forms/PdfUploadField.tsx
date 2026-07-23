"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Upload, FileText, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PdfUploadFieldProps {
  name?: string;
  label?: string;
  placeholder?: string;
}

export function PdfUploadField({
  name = "pdfUrl",
  label = "PDF Document",
  placeholder = "Upload a PDF or enter a direct URL",
}: PdfUploadFieldProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const currentUrl = watch(name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorMessage = (errors[name] as any)?.message;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.url) {
        setValue(name, json.url, { shouldValidate: true, shouldDirty: true });
        toast.success("PDF uploaded successfully!");
      } else {
        toast.error(json.message || "Failed to upload PDF");
      }
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload error. Please try again.");
    } finally {
      setUploading(false);
      // Reset input value so same file can be selected again if needed
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {/* Direct URL text input */}
        <div className="relative flex-1">
          <input
            {...register(name)}
            type="text"
            disabled={uploading}
            placeholder={placeholder}
            className={`w-full px-3.5 py-2.5 bg-background border ${
              errorMessage ? "border-red-500" : "border-border"
            } rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors disabled:opacity-60`}
          />
          {currentUrl && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary-500 p-1 transition-colors"
              title="View PDF"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>

        {/* Upload Button */}
        <label
          className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all cursor-pointer select-none ${
            uploading
              ? "bg-muted/10 border-border text-muted cursor-wait"
              : "bg-primary-600 hover:bg-primary-700 text-white border-transparent shadow-sm"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Uploading...</span>
            </>
          ) : currentUrl ? (
            <>
              <CheckCircle2 size={16} />
              <span>Change PDF</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Upload PDF</span>
            </>
          )}

          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      </div>

      {currentUrl && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
          <FileText size={14} />
          <span className="truncate max-w-md">{currentUrl}</span>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">{String(errorMessage)}</p>
      )}
    </div>
  );
}
