import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Minimal headless radio group. We don't need @radix-ui/react-radio-group
 * for the options page — only one consumer, 3 fixed options — so this
 * keeps the bundle leaner and the API familiar (native `input type=radio`
 * with styled labels).
 *
 * Visuals follow Cursor: each option is a cream card with an oklab
 * ring; the selected card gets a stronger ring + warm-filled background
 * instead of a bright brand color. Hover subtly tints but does NOT
 * shift color — the crimson hover is reserved for clickable text, not
 * for choice-making widgets.
 */

interface RadioGroupProps<Value extends string> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  value: Value;
  onValueChange: (value: Value) => void;
  name?: string;
}

export function RadioGroup<Value extends string>({
  className,
  value,
  onValueChange,
  name,
  children,
  ...props
}: RadioGroupProps<Value>) {
  // Widen to string at the context boundary — RadioGroupItem is the
  // sole consumer and it only reads the current value for an equality
  // check, never assigns. Keeps callers strongly typed while the
  // runtime contract stays plain string-in / string-out.
  const ctx = {
    value,
    onValueChange: onValueChange as (v: string) => void,
    name,
  };
  return (
    <RadioGroupContext.Provider value={ctx}>
      <div
        role="radiogroup"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps extends React.HTMLAttributes<HTMLLabelElement> {
  value: string;
  title: string;
  description?: string;
  disabled?: boolean;
}

export function RadioGroupItem({
  className,
  value,
  title,
  description,
  disabled,
  ...rest
}: RadioGroupItemProps) {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx) throw new Error("RadioGroupItem must be inside RadioGroup");
  const checked = ctx.value === value;
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-200 p-3 transition-colors",
        checked
          ? "border-foreground/55 bg-surface-300"
          : "hover:border-ring hover:bg-surface-100",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...rest}
    >
      <input
        type="radio"
        name={ctx.name}
        value={value}
        checked={checked}
        onChange={() => ctx.onValueChange(value)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-foreground"
      />
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium leading-tight">{title}</span>
        {description && (
          <span className="mt-1 font-serif text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}

interface RadioGroupContextValue<Value extends string = string> {
  value: Value;
  onValueChange: (value: Value) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
);
