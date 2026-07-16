"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChoiceSelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  ariaLabel?: string;
}

// Тонкая обёртка над shadcn Select: value/onChange работают с любым типом (в т.ч.
// числовыми enum'ами настроек приватности). base-ui сопоставляет пункты по значению.
export function ChoiceSelect<T extends string | number>({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
}: ChoiceSelectProps<T>) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as T)}
      disabled={disabled}
    >
      <SelectTrigger aria-label={ariaLabel} className="min-w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={String(option.value)} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
