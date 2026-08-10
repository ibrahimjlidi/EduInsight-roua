function Panel({ children, className = "" }) {
  return (
    <section className={`rounded-[1.35rem] border border-slate-200/80 bg-white/90 shadow-sm shadow-blue-950/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 dark:border-slate-800 dark:bg-slate-950/90 dark:hover:border-blue-500/30 ${className}`}>
      {children}
    </section>
  );
}

export default Panel;
