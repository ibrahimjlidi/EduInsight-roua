function Panel({ children, className = "" }) {
  return (
    <section className={`rounded-[1.35rem] border border-slate-200/80 bg-white/90 shadow-sm shadow-blue-950/5 transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/90 ${className}`}>
      {children}
    </section>
  );
}

export default Panel;
