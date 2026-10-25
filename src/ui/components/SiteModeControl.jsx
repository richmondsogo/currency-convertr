// src/ui/components/SiteModeControl.jsx
import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/ui/components/ui/toggle-group";
import { cn } from "@/ui/lib/utils";

/**
 * Three-way segmented control for site conversion mode: Ask | Always | Never.
 *
 * @param {object} props
 * @param {"ask"|"always"|"never"|""} props.value - Active mode or empty string if unset/inheriting default
 * @param {(mode: "ask"|"always"|"never") => void} props.onChange - Selection handler
 * @param {string} [props.ariaLabel="Conversion mode"] - Accessible label for group
 * @param {string} [props.domain] - Optional domain name to provide contextual aria-labels
 * @param {"sm"|"default"} [props.size="sm"] - Size variant
 * @param {boolean} [props.disabled=false] - Whether control is disabled
 * @param {string} [props.className] - Additional classes
 */
export function SiteModeControl({
  value = "",
  onChange,
  ariaLabel = "Conversion mode",
  domain,
  size = "sm",
  disabled = false,
  className,
  id,
}) {
  const itemClasses = size === "sm"
    ? "text-xs h-7 px-2.5 rounded-md font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground data-[state=on]:text-foreground data-[state=on]:bg-background data-[state=on]:shadow-xs data-[state=on]:border data-[state=on]:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-[background-color,color,box-shadow,transform] motion-safe:active:scale-[0.98]"
    : "text-xs h-8 px-3 rounded-md font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground data-[state=on]:text-foreground data-[state=on]:bg-background data-[state=on]:shadow-xs data-[state=on]:border data-[state=on]:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-[background-color,color,box-shadow,transform] motion-safe:active:scale-[0.98]";

  const askLabel = domain ? `Ask on ${domain}` : "Mode Ask";
  const alwaysLabel = domain ? `Always convert ${domain}` : "Mode Always";
  const neverLabel = domain ? `Never convert ${domain}` : "Mode Never";

  return (
    <ToggleGroup
      id={id}
      type="single"
      value={value || ""}
      onValueChange={(val) => {
        if (!val || disabled) return;
        onChange?.(val);
      }}
      disabled={disabled}
      className={cn("bg-secondary/70 p-0.5 rounded-lg border border-border/70 shrink-0 gap-0.5", className)}
      aria-label={ariaLabel}
    >
      <ToggleGroupItem
        value="ask"
        aria-label={askLabel}
        className={itemClasses}
      >
        Ask
      </ToggleGroupItem>
      <ToggleGroupItem
        value="always"
        aria-label={alwaysLabel}
        className={itemClasses}
      >
        Always
      </ToggleGroupItem>
      <ToggleGroupItem
        value="never"
        aria-label={neverLabel}
        className={itemClasses}
      >
        Never
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
