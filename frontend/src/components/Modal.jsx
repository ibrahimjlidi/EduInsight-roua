import { X } from "lucide-react";

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-md">
      <div className="relative w-full max-w-2xl animate-pop overflow-hidden rounded-[1.35rem] border border-white/60 bg-white p-6 shadow-2xl shadow-blue-950/25 dark:border-slate-700 dark:bg-slate-950">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#10b981,#f59e0b,#2563eb)] bg-200% animate-gradient-move" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
