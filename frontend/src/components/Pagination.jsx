import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ page, pages, total, limit, onPageChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
      <span>
        Page {page} / {pages} · {total} total · {limit} par page
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </button>
        <button
          type="button"
          disabled={page === pages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
