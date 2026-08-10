// src/components/StatCard.jsx
function StatCard({ label, value, hint, icon: Icon, color = "cyan" }) {
  const colors = {
    cyan: {
      bg: "border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.92),rgba(240,249,255,0.78))] dark:border-cyan-500/20 dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.5),rgba(15,23,42,0.75))]",
      icon: "text-cyan-500 dark:text-cyan-400",
      bar: "bg-[linear-gradient(90deg,#06b6d4,#2563eb,#06b6d4)]",
    },
    blue: {
      bg: "border-blue-200/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.94),rgba(238,242,255,0.8))] dark:border-blue-500/20 dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.25),rgba(15,23,42,0.78))]",
      icon: "text-blue-500 dark:text-blue-400",
      bar: "bg-[linear-gradient(90deg,#2563eb,#7c3aed,#2563eb)]",
    },
    green: {
      bg: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(240,253,250,0.78))] dark:border-emerald-500/20 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.35),rgba(15,23,42,0.78))]",
      icon: "text-emerald-500 dark:text-emerald-400",
      bar: "bg-[linear-gradient(90deg,#10b981,#22c55e,#10b981)]",
    },
    orange: {
      bg: "border-orange-200/80 bg-[linear-gradient(135deg,rgba(255,247,237,0.95),rgba(255,251,235,0.78))] dark:border-orange-500/20 dark:bg-[linear-gradient(135deg,rgba(124,45,18,0.28),rgba(15,23,42,0.78))]",
      icon: "text-orange-500 dark:text-orange-400",
      bar: "bg-[linear-gradient(90deg,#f97316,#f59e0b,#f97316)]",
    },
    purple: {
      bg: "border-violet-200/80 bg-[linear-gradient(135deg,rgba(245,243,255,0.95),rgba(253,244,255,0.75))] dark:border-violet-500/20 dark:bg-[linear-gradient(135deg,rgba(76,29,149,0.3),rgba(15,23,42,0.78))]",
      icon: "text-violet-500 dark:text-violet-400",
      bar: "bg-[linear-gradient(90deg,#7c3aed,#db2777,#7c3aed)]",
    },
    red: {
      bg: "border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,228,230,0.78))] dark:border-rose-500/20 dark:bg-[linear-gradient(135deg,rgba(136,19,55,0.28),rgba(15,23,42,0.78))]",
      icon: "text-red-500 dark:text-red-400",
      bar: "bg-[linear-gradient(90deg,#e11d48,#f97316,#e11d48)]",
    },
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-[1.35rem] border
        ${colors[color].bg}
        backdrop-blur-md
        p-6 transition-all duration-300
        animate-rise hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-950/10
      `}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-y-0 -left-16 w-14 bg-white/35 group-hover:animate-shine" />
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{value}</h2>
          {hint && <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-3">▲ {hint}</p>}
        </div>

        <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-white/70 dark:border-slate-800 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
          {Icon && <Icon className={`w-6 h-6 ${colors[color].icon}`} />}
        </div>
      </div>

      <div className="mt-6 h-[2px] w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full w-2/3 ${colors[color].bar} bg-200% animate-gradient-move rounded-full transition-all duration-500 group-hover:w-full`}></div>
      </div>
    </div>
  );
}

export default StatCard;
