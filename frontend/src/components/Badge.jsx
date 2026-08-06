const styles = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  student: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  teacher: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  admin: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  available: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  upcoming: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  inactive: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function Badge({ children, tone = "default" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${styles[tone] || styles.default}`}>
      {children}
    </span>
  );
}

export default Badge;
