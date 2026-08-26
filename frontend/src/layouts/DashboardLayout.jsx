// src/layouts/DashboardLayout.jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, CheckCheck, GraduationCap, LogOut, Moon, Sun } from "lucide-react";
import { sidebarConfig } from "../config/sidebarConfig";
import { useTheme } from "../context/ThemeContext";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notificationApi";

function DashboardLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "student";

  const menuItems = sidebarConfig[role] || [];
  const { isDark, toggleTheme } = useTheme();
  const roleHome = { admin: "/admin", teacher: "/teacher/courses", student: "/student/courses" };
  const uploadsBase = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");
  const avatarUrl = user?.avatar ? `${uploadsBase}/uploads/avatars/${user.avatar}` : "";
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications({ page: 1, limit: 5 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification._id);
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    fetchNotifications();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_48%,#f7fbf8_100%)] text-slate-950 transition-colors dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_55%,#06131f_100%)] dark:text-white lg:flex">
      <aside className="z-20 flex w-full flex-shrink-0 flex-col border-r border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:sticky lg:top-0 lg:h-screen lg:w-[288px]">
        <div className="relative min-h-[116px] border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#10b981,#f59e0b,#2563eb)] bg-200% animate-gradient-move" />
          <div className="flex items-center gap-3">
            <div className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#0ea5e9,#10b981)] bg-200% text-white shadow-lg shadow-blue-600/25 animate-gradient-move">
              <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition group-hover:opacity-100" />
              <GraduationCap className="h-7 w-7 animate-float drop-shadow-sm group-hover:animate-wiggle-soft" />
            </div>
            <div>
              <h2 className="bg-[linear-gradient(90deg,#0f172a,#2563eb,#0f766e)] bg-clip-text text-2xl font-black tracking-tight text-transparent dark:bg-[linear-gradient(90deg,#ffffff,#93c5fd,#6ee7b7)] dark:bg-clip-text">EduInsight</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Complete Learning Platform</p>
            </div>
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="flex rounded-2xl bg-slate-100 p-1 shadow-inner shadow-slate-200/70 dark:bg-slate-900 dark:shadow-black/30">
            {["admin", "teacher", "student"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => navigate(roleHome[r])}
                className={`relative flex-1 overflow-hidden rounded-xl py-2 text-center text-sm font-bold capitalize transition-all duration-300 ${
                  role === r
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300"
                    : "text-slate-500 hover:bg-white/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                }`}
              >
                {role === r && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-500 animate-slide-fade" />}
                {r}
              </button>
            ))}
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-5">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3 text-[15px] transition-all duration-300 ${
                  active
                    ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-950/5 dark:bg-blue-500/10 dark:text-blue-300"
                    : "text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[linear-gradient(180deg,#2563eb,#10b981)] animate-slide-fade" />}
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${active ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "bg-transparent group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-slate-800"}`}>
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${active ? "text-blue-600 dark:text-blue-300" : "group-hover:scale-110 group-hover:rotate-3"}`} />
                </span>
                <span className="font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 border-t border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-lg font-black text-slate-700 dark:bg-slate-800 dark:text-blue-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </>
              )}
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
        <header className="px-6 pt-7 md:px-8 xl:px-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">{title}</h1>
              {subtitle && <p className="text-lg font-bold text-slate-500 dark:text-slate-400">· {subtitle}</p>}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-glow-pulse" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-black text-white shadow-lg shadow-rose-500/30">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <Bell className="w-5 h-5 text-slate-600 transition group-hover:rotate-6 dark:text-slate-300" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/95 shadow-2xl shadow-slate-950/15 backdrop-blur-xl animate-pop dark:border-slate-800 dark:bg-slate-950/95">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">Notifications</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Read all
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className="group flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-blue-50/80 dark:hover:bg-blue-500/10"
                        >
                          <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${notification.isRead ? "bg-slate-300 dark:bg-slate-700" : "bg-blue-500 animate-glow-pulse"}`} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-slate-900 dark:text-white">{notification.title || "Notification"}</span>
                            <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{notification.message || "New platform update."}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 xl:p-10">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;
