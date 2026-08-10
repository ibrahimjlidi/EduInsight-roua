// src/components/SearchInput.jsx
import { Search } from "lucide-react";

function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="group relative w-full max-w-sm">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,#2563eb,#10b981,#f59e0b)] opacity-0 blur transition duration-300 group-focus-within:opacity-25" />
      <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition duration-300 group-focus-within:scale-110 group-focus-within:text-blue-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="relative w-full rounded-2xl border border-slate-200 bg-white/85 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950/80 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
      />
    </div>
  );
}

export default SearchInput;
