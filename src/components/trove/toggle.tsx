import { cn } from "@/lib/utils";

export function Toggle({
  pressed,
  onPressedChange,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "onClick"> & { pressed: boolean; onPressedChange: (p: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm transition-colors hover:bg-muted aria-pressed:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
