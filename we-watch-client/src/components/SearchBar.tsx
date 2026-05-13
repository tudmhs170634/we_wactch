import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
}: SearchBarProps) {
  return (
    <div className="relative w-full max-w-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-3 pl-10 text-sm text-white placeholder-gray-400 transition-colors focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}
