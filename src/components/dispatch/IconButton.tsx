"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface IconButtonProps {
  label: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function IconButton({ label, disabled, destructive, onClick, children }: IconButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`size-10 shrink-0 rounded-lg ${destructive ? "text-destructive hover:bg-destructive/5 hover:text-destructive" : "text-muted-foreground"}`}
    >
      {children}
    </Button>
  );
}
