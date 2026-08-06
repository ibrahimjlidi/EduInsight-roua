// src/components/StatCard.jsx
function StatCard({ label, value, hint, icon: Icon, color = "cyan" }) {
  const colors = {
    cyan: {
      bg: "border-cyan-200/80 bg-cyan-50/70 dark:border-cyan-500/20 dark:bg-cyan-500/10",
      icon: "text-cyan-500 dark:text-cyan-400",
      bar: "bg-cyan-500",
    },
    blue: {
      bg: "border-blue-200/80 bg-blue-50/70 dark:border-blue-500/20 dark:bg-blue-500/10",
      icon: "text-blue-500 dark:text-blue-400",
      bar: "bg-blue-500",
    },
    green: {
      bg: "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10",
      icon: "text-emerald-500 dark:text-emerald-400",
      bar: "bg-emerald-500",
    },
    orange: {
      bg: "border-orange-200/80 bg-orange-50/70 dark:border-orange-500/20 dark:bg-orange-500/10",
      icon: "text-orange-500 dark:text-orange-400",
      bar: "bg-orange-500",
    },
    purple: {
      bg: "border-violet-200/80 bg-violet-50/70 dark:border-violet-500/20 dark:bg-violet-500/10",
      icon: "text-violet-500 dark:text-violet-400",
      bar: "bg-violet-500",
    },
    red: {
      bg: "border-rose-200/80 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/10",
      icon: "text-red-500 dark:text-red-400",
      bar: "bg-rose-500",
    },
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-[1.35rem] border
        ${colors[color].bg}
        backdrop-blur-md
        p-6 transition-all duration-300
        animate-rise hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10
      `}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{value}</h2>
          {hint && <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-3">▲ {hint}</p>}
        </div>

        <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-white/70 dark:border-slate-800 flex items-center justify-center shadow-sm">
          {Icon && <Icon className={`w-6 h-6 ${colors[color].icon}`} />}
        </div>
      </div>

      <div className="mt-6 h-[2px] w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full w-2/3 ${colors[color].bar} rounded-full`}></div>
      </div>
    </div>
  );
}

export default StatCard;
