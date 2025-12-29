"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none",
        "has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 has-[input:focus]:ring-[3px]",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        "[&>input]:border-none [&>input]:bg-transparent [&>input]:shadow-none [&>input]:outline-none [&>input]:ring-0 [&>input]:focus-visible:ring-0 [&>input]:focus-visible:ring-offset-0",
        className
      )}
      {...props}
    />
  );
});
InputGroup.displayName = "InputGroup";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full min-w-0 flex-1 px-3 py-1 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
InputGroupInput.displayName = "InputGroupInput";

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "flex items-center justify-center px-3 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});
InputGroupText.displayName = "InputGroupText";

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "h-9 px-3 hover:bg-accent hover:text-accent-foreground rounded-e-md",
        className
      )}
      {...props}
    />
  );
});
InputGroupButton.displayName = "InputGroupButton";

export { InputGroup, InputGroupInput, InputGroupText, InputGroupButton };
