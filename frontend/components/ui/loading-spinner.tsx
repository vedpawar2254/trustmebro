import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  label?: string
}

export function LoadingSpinner({ className, size = "md", label }: LoadingSpinnerProps) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" }
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "border-2 border-border border-t-primary rounded-full animate-spin",
          sizes[size]
        )}
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  )
}
