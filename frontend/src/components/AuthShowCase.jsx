// src/components/AuthShowcase.jsx
function AuthShowcase() {
  return (
    <div className="flex-1 flex flex-col justify-between p-10">
      <div>
        <div className="flex items-center justify-between mb-10">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-2xl">
            🎓
          </div>
          <span className="text-xs tracking-widest text-cyan-400 border border-cyan-400/30 rounded-full px-3 py-1">
            SMART EDUCATION
          </span>
        </div>

        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
          Empower every learner<br />with actionable insights.
        </h1>
        <p className="text-slate-400 max-w-md">
          Monitor course engagement, quiz outcomes, and student progress in a single polished workspace.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mt-10">
        <p className="text-cyan-400 font-semibold mb-3">✨ Why teams love EduInsight</p>
        <ul className="text-slate-400 space-y-2 text-sm">
          <li>• Real-time teaching analytics</li>
          <li>• Beautiful dashboards for instructors and students</li>
          <li>• Secure authentication and modern UI</li>
        </ul>
      </div>
    </div>
  );
}

export default AuthShowcase;