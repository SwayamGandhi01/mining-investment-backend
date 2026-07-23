"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { TextField } from "@/components/forms/TextField";
import { TextareaField } from "@/components/forms/TextareaField";
import { ToggleField } from "@/components/forms/ToggleField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm({
    defaultValues: {
      siteName: "Investment Platform",
      siteDescription: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      social: {
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
        youtube: "",
      },
      defaultSeoTitle: "",
      defaultSeoDescription: "",
      maintenanceMode: false,
      registrationEnabled: true,
    },
  });

  useEffect(() => {
    axios.get("/api/settings").then((res) => {
      if (res.data.success && res.data.data) {
        methods.reset(res.data.data);
      }
      setLoading(false);
    });
  }, [methods]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const res = await axios.put("/api/settings", data);
      if (res.data.success) {
        toast.success("Settings updated successfully!");
        
        // Dynamically update favicon in browser tab
        const fav = data.favicon?.url || data.logo?.url;
        if (fav) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "shortcut icon";
            document.getElementsByTagName("head")[0].appendChild(link);
          }
          link.href = fav;
        }

        if (data.siteName) {
          document.title = `${data.siteName} - Admin`;
        }
      }
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading settings..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Global Settings</h1>
        <p className="text-sm text-muted mt-0.5">Manage platform configurations and branding</p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Branding & Contact
            </h2>
            <TextField name="siteName" label="Platform Name" required />
            <TextareaField name="siteDescription" label="Platform Description" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploadField name="logo" label="Site Logo" folder="settings" />
              <ImageUploadField name="favicon" label="Favicon" folder="settings" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="contactEmail" label="Contact Email" />
              <TextField name="contactPhone" label="Contact Phone" />
            </div>
            <TextField name="address" label="Physical Address" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Social Media Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="social.linkedin" label="LinkedIn URL" />
              <TextField name="social.twitter" label="Twitter/X URL" />
              <TextField name="social.facebook" label="Facebook URL" />
              <TextField name="social.instagram" label="Instagram URL" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              System Controls
            </h2>
            <div className="space-y-3">
              <ToggleField name="maintenanceMode" label="Maintenance Mode" helperText="Disable public interactions temporarily" />
              <ToggleField name="registrationEnabled" label="User Registration Allowed" helperText="Enable public attendee registration" />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Settings
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
