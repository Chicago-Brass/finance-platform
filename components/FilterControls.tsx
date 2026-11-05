"use client";

import { useId, useRef } from "react";
import type { FocusEventHandler, KeyboardEvent, ReactNode, Ref } from "react";
import { ReportIcon } from "./ReportIcons";
import "./filter-controls.css";

export function FilterBar({ label, children, className = "", role = "group" }: { label: string; children: ReactNode; className?: string; role?: "group" | "search" }) {
  return <div className={`dashboard-control-bar filter-control-bar ${className}`} role={role} aria-label={label}>{children}</div>;
}

export function FilterField({ label, htmlFor, children, className = "", ref }: { label: string; htmlFor?: string; children: ReactNode; className?: string; ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} className={`filter-control-field ${className}`}>
    {htmlFor ? <label className="filter-control-label" htmlFor={htmlFor}>{label}</label> : <span className="filter-control-label">{label}</span>}
    {children}
  </div>;
}

export function SearchField({ label, value, onChange, placeholder = "Search...", disabled, title, id, name, maxLength, onFocus, onBlur }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
  id?: string;
  name?: string;
  maxLength?: number;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}) {
  const generatedId = useId(), inputId = id ?? `search-${generatedId}`;
  return <FilterField label={label} htmlFor={inputId} className="filter-search-field">
    <div className="filter-search">
      <ReportIcon name="search" />
      <input id={inputId} type="search" name={name} value={value} onChange={event => onChange(event.target.value)}
        placeholder={placeholder} disabled={disabled} title={title} maxLength={maxLength} autoComplete="off"
        spellCheck={false} enterKeyHint="search" onFocus={onFocus} onBlur={onBlur} />
    </div>
  </FilterField>;
}

export function SegmentedControl<G extends string | boolean>({ label, value, options, onChange, className = "", disabled = false }: {
  label: string;
  value: G;
  options: readonly { value: G; label: string }[];
  onChange: (value: G) => void;
  className?: string;
  disabled?: boolean;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.findIndex(option => option.value === value);
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + options.length - 1) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    onChange(options[next].value);
    buttons.current[next]?.focus();
  };
  return <FilterField label={label} className={className}>
    <div className="filter-segmented" role="group" aria-label={label} aria-disabled={disabled || undefined}>
      {options.map((option, index) => <button key={String(option.value)} ref={button => { buttons.current[index] = button; }}
        type="button" disabled={disabled} aria-pressed={value === option.value} tabIndex={index === (selected < 0 ? 0 : selected) ? 0 : -1}
        onClick={() => onChange(option.value)} onKeyDown={event => move(event, index)}>{option.label}</button>)}
    </div>
  </FilterField>;
}
