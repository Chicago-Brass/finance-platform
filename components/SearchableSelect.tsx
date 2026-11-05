"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { selectActive, selectGroups } from "./searchable-select-utils";
import type { SelectOption } from "./searchable-select-utils";
import "./searchable-select.css";

export type { SelectOption } from "./searchable-select-utils";

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
};

/** A searchable single-select; the popup stays outside scrolling report panels. */
export function SearchableSelect({ label, value, options, onChange, placeholder = "Select...", disabled = false, id, name, className = "" }: Props) {
  const generatedId = useId();
  const inputId = id ?? `select-${generatedId}`, listId = `${inputId}-options`;
  const root = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null), popup = useRef<HTMLDivElement>(null), list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [query, setQuery] = useState(""), [active, setActive] = useState<string | null>(null);
  const [position, setPosition] = useState<CSSProperties>({ visibility: "hidden" });
  const groups = useMemo(() => selectGroups(options, query), [options, query]);
  const visible = useMemo(() => groups.flatMap(group => group.options), [groups]);
  const selected = options.find(option => option.value === value);
  const current = visible.find(option => option.value === active && !option.disabled) ?? visible.find(option => !option.disabled);
  const activeIndex = current ? visible.indexOf(current) : -1;
  const expanded = open && !disabled;

  const close = () => { setOpen(false); setQuery(""); };
  const show = () => { if (!disabled) { setQuery(""); setActive(value); setOpen(true); } };
  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    close();
  };

  useLayoutEffect(() => {
    if (!expanded) return;
    const place = () => {
      if (!input.current) return;
      const rect = input.current.getBoundingClientRect(), gap = 6, inset = 12;
      const below = window.innerHeight - rect.bottom - inset - gap, above = rect.top - inset - gap;
      const aboveInput = below < 160 && above > below;
      const width = Math.min(Math.max(rect.width, 240), window.innerWidth - inset * 2);
      setPosition({
        left: Math.max(inset, Math.min(rect.left, window.innerWidth - width - inset)), width,
        maxHeight: Math.max(80, Math.min(320, aboveInput ? above : below)),
        ...(aboveInput ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !popup.current?.contains(target)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded]);

  useEffect(() => {
    if (!expanded || activeIndex < 0 || !list.current) return;
    const option = document.getElementById(`${listId}-${activeIndex}`);
    if (!option) return;
    const parent = list.current, optionTop = option.offsetTop, optionBottom = optionTop + option.offsetHeight;
    if (optionTop < parent.scrollTop) parent.scrollTop = optionTop;
    else if (optionBottom > parent.scrollTop + parent.clientHeight) parent.scrollTop = optionBottom - parent.clientHeight;
  }, [expanded, activeIndex, listId, visible]);

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!expanded) { show(); if (event.key === "Home" || event.key === "End") setActive(selectActive(options, value, event.key)); }
      else setActive(selectActive(visible, current?.value ?? null, event.key));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (!expanded) show();
      else if (current) choose(current);
    } else if (event.key === "Escape" && expanded) {
      event.preventDefault(); event.stopPropagation(); close();
    } else if (event.key === "Tab") close();
    else if (!expanded && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); setQuery(event.key); setActive(null); setOpen(true);
    }
  };

  return <div ref={root} className={`searchable-select ${className}${disabled ? " is-disabled" : ""}`}>
    <label className="searchable-select-label" htmlFor={inputId}>{label}</label>
    <div className="searchable-select-field">
      <input ref={input} id={inputId} type="text" role="combobox" autoComplete="off" spellCheck={false}
        aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? listId : undefined}
        aria-activedescendant={expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        value={expanded ? query : selected?.label ?? ""} placeholder={expanded ? "Search..." : placeholder}
        disabled={disabled} onFocus={show} onClick={() => { if (!expanded) show(); }}
        onBlur={close} onKeyDown={keyDown} onChange={event => { setQuery(event.target.value); setActive(null); setOpen(true); }} />
      <span className="searchable-select-caret" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg></span>
    </div>
    {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
    {expanded && createPortal(<div ref={popup} className="searchable-select-popup" style={position}>
      <div ref={list} id={listId} role="listbox" aria-label={label} className="searchable-select-list">
        {groups.map(group => <div key={group.label} role="group" aria-label={group.label || undefined}>
          {group.label && <div className="searchable-select-group" aria-hidden="true">{group.label}</div>}
          {group.options.map(option => {
            const index = visible.indexOf(option);
            return <div key={option.value} id={`${listId}-${index}`} role="option" aria-selected={value === option.value}
              aria-disabled={option.disabled || undefined} className={`searchable-select-option${current?.value === option.value ? " is-active" : ""}`}
              onPointerDown={event => event.preventDefault()} onMouseEnter={() => { if (!option.disabled) setActive(option.value); }} onClick={() => choose(option)}>
              <span>{option.label}</span>{value === option.value && <svg className="searchable-select-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7" /></svg>}
            </div>;
          })}
        </div>)}
      </div>
      {!visible.length && <div className="searchable-select-empty" role="status">No matches</div>}
    </div>, input.current?.closest('[role="dialog"]') ?? document.body)}
  </div>;
}
