import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { MagnifyingGlass } from "@phosphor-icons/react"

import { cn } from "@/ui/lib/utils"
import { Dialog, DialogContent } from "@/ui/components/ui/dialog"

const Command = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({
  children,
  ...props
}) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

// Hook getElementById for cmdk internal lookup so custom element IDs do not cause focus loss
if (typeof document !== 'undefined' && !document.__cmdk_id_hooked) {
  document.__cmdk_id_hooked = true;
  const origGetElementById = document.getElementById.bind(document);
  document.getElementById = function(elementId) {
    const el = origGetElementById(elementId);
    if (el) return el;
    try {
      return document.querySelector(`[data-cmdk-id="${elementId}"]`);
    } catch {
      return null;
    }
  };
}

const CommandInput = React.forwardRef(({ className, id, ...props }, ref) => {
  const innerRef = React.useRef(null);

  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <MagnifyingGlass className="mr-2 h-4 w-4 shrink-0 opacity-60 text-muted-foreground" weight="bold" aria-hidden="true" />
      <CommandPrimitive.Input
        ref={(el) => {
          innerRef.current = el;
          if (el) {
            const originalId = el.getAttribute("data-cmdk-id") || el.id;
            if (originalId && originalId !== id) {
              el.setAttribute("data-cmdk-id", originalId);
            }
            if (id) {
              el.id = id;
            }
          }
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-2.5 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  );
})

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef(({ className, onSelect, onClick, ...props }, ref) => {
  const handleClick = (e) => {
    onClick?.(e);
    onSelect?.();
  };

  return (
    <CommandPrimitive.Item
      ref={ref}
      onSelect={onSelect}
      onClick={handleClick}
      className={cn(
        "relative flex cursor-default gap-2 select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors data-[disabled=true]:pointer-events-none data-[selected='true']:bg-secondary data-[selected=true]:text-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
})

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
