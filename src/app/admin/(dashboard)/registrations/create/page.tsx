"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { registrationSchema, RegistrationInput } from "@/lib/validations/registration";

export default function CreateRegistrationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState<{ label: string; value: string }[]>([]);

  const methods = useForm<RegistrationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registrationSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      ticketType: "Standard",
      paymentStatus: "free",
      status: "confirmed",
    },
  });

  useEffect(() => {
    axios.get("/api/events?limit=100").then((res) => {
      if (res.data.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEvents(res.data.data.map((e: any) => ({ label: e.title, value: e._id })));
        if (res.data.data.length > 0) {
          methods.setValue("event", res.data.data[0]._id);
        }
      }
    });
  }, [methods]);

  const onSubmit = async (data: RegistrationInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/registrations", data);
      if (res.data.success) {
        toast.success("Registration created successfully!");
        router.push("/admin/registrations");
      }
    } catch {
      toast.error("Failed to create registration");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/registrations"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Registration</h1>
          <p className="text-sm text-muted mt-0.5">Register an attendee for an event</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Attendee & Event
            </h2>
            <SelectField name="event" label="Select Event" options={events} required />
            <TextField name="name" label="Full Name" required placeholder="John Smith" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="email" label="Email Address" required placeholder="john@example.com" />
              <TextField name="phone" label="Phone Number" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="company" label="Company" placeholder="Apex Investments" />
              <TextField name="jobTitle" label="Job Title" placeholder="Managing Partner" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Ticket & Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField name="ticketType" label="Ticket Type" placeholder="VIP / Standard" />
              <SelectField
                name="paymentStatus"
                label="Payment Status"
                options={[
                  { label: "Free", value: "free" },
                  { label: "Completed", value: "completed" },
                  { label: "Pending", value: "pending" },
                  { label: "Refunded", value: "refunded" },
                ]}
              />
              <SelectField
                name="status"
                label="Registration Status"
                options={[
                  { label: "Confirmed", value: "confirmed" },
                  { label: "Pending", value: "pending" },
                  { label: "Attended", value: "attended" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/registrations"
              className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Registration
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
