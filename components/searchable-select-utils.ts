export type SelectOption = { value: string; label: string; group?: string; disabled?: boolean };

export function selectGroups(options: SelectOption[], query: string) {
  const search = query.trim().toLocaleLowerCase();
  const groups = new Map<string, SelectOption[]>();
  for (const option of options) {
    if (search && !`${option.label} ${option.value} ${option.group ?? ""}`.toLocaleLowerCase().includes(search)) continue;
    const label = option.group ?? "";
    const group = groups.get(label) ?? [];
    group.push(option);
    groups.set(label, group);
  }
  return [...groups].map(([label, choices]) => ({ label, options: choices }));
}

export function selectActive(options: SelectOption[], active: string | null, key: string) {
  const enabled = options.filter(option => !option.disabled);
  if (!enabled.length) return null;
  if (key === "Home") return enabled[0].value;
  if (key === "End") return enabled[enabled.length - 1].value;
  const index = enabled.findIndex(option => option.value === active);
  if (index < 0) return key === "ArrowUp" ? enabled[enabled.length - 1].value : enabled[0].value;
  return enabled[Math.max(0, Math.min(enabled.length - 1, index + (key === "ArrowUp" ? -1 : 1)))].value;
}
