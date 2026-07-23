import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
  success:
    "bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-500",
  warning:
    "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
  danger:
    "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
  info: "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400",
  secondary:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
