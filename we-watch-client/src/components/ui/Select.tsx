import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SelectProps<T extends string> = {
  value: T;
  onChange: (next: T) => void;
  options: Array<SelectOption<T>>;
  mode?: 'overlay' | 'inline';
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  disabled?: boolean;
};

export default function Select<T extends string>({
  value,
  onChange,
  options,
  mode = 'overlay',
  className,
  buttonClassName,
  menuClassName,
  optionClassName,
  disabled,
}: SelectProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    return options.find((o) => o.value === value)?.label ?? String(value);
  }, [options, value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`glass focus:border-primary/50 flex w-full cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-transparent px-5 py-3 text-sm font-bold text-white outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName ?? ''}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`max-h-60 overflow-y-auto overflow-x-hidden rounded-[18px] border border-white/10 bg-[#0A0A0B] shadow-2xl ${
            mode === 'overlay'
              ? 'absolute left-0 right-0 z-300 mt-2'
              : 'relative mt-2'
          } ${menuClassName ?? ''}`}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                } ${optionClassName ?? ''}`}
              >
                <span className="truncate">{opt.label}</span>
                {active && <span className="text-xs text-[#C800DF]">•</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

