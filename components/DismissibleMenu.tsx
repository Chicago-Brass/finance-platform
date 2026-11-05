"use client";

import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

/** Native menus keep keyboard behavior and dismiss when interaction moves outside. */
export function DismissibleMenu({ onKeyDown, ...props }: ComponentPropsWithoutRef<"details">) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: Event) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    document.addEventListener("pointerdown", dismiss, true);
    document.addEventListener("focusin", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss, true);
      document.removeEventListener("focusin", dismiss);
    };
  }, []);
  return <details {...props} ref={menu} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.open = false;
    event.currentTarget.querySelector("summary")?.focus();
  }} />;
}
