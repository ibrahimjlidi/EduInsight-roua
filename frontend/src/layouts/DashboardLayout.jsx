// src/layouts/DashboardLayout.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, GraduationCap, LogOut, Moon, Sun } from "lucide-react";
import { sidebarConfig } from "../config/sidebarConfig";
import { useTheme } from "../context/ThemeContext";

function DashboardLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "student";

  const menuItems = sidebarConfig[role] || [];
  const { isDark, toggleTheme } = useTheme();
  const roleHome = { admin: "/admin", teacher: "/teacher/courses", student: "/student/courses" };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 transition-colors dark:bg-slate-950 dark:text-white lg:flex">
      <aside className="sticky top-0 z-30 flex h-screen w-full flex-col border-r border-slate-200/80 bg-white/95 shadow-sm shadow-blue-950/5 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/95 lg:w-72">
        <div className="px-6 py-7 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">EduInsight</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Complete Learning Platform</p>
            </div>
          </div>
        </div>

        <div className="px-5 pt-6">
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
            {["admin", "teacher", "student"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => navigate(roleHome[r])}
                className={`flex-1 rounded-xl py-2 text-center text-sm font-bold capitalize transition-all duration-300 ${
                  role === r
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-5 py-6">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-4 rounded-2xl px-4 py-3 text-[15px] transition-all duration-300 ${
                  active
                    ? "bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-500/10 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-300 ${active ? "text-blue-600 dark:text-blue-300" : "group-hover:scale-110"}`} />
                <span className="font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-black text-slate-700 dark:bg-slate-800 dark:text-blue-200">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-black text-slate-950 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm font-semibold capitalize text-slate-500 dark:text-slate-400">{role}</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="px-6 pt-8 md:px-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h1>
              {subtitle && <p className="text-lg font-bold text-slate-500 dark:text-slate-400">· {subtitle}</p>}
            </div>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;
