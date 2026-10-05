import { useEffect, useState } from "react";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock3,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import Panel from "../../components/Panel";
import StatCard from "../../components/StatCard";

import { getAdminDashboard } from "../../api/dashboardApi";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAdminDashboard();

        console.log("Admin dashboard response:", response);

        setData(response);
      } catch (err) {
        console.error(
          "Erreur chargement dashboard admin :",
          err
        );

        setError(
          "Backend unavailable. Start the API server and refresh."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const dashboard = data || {
    totalUsers: 0,
    activeCourses: 0,
    quizCompletion: 0,
    avgGrade: 0,
    completionRate: 0,
    totalStudents: 0,
    roleDistribution: [],
    userGrowth: [],
  };

  const distribution = (
    dashboard.roleDistribution || []
  ).map((item, index) => ({
    ...item,
    color:
      ["#2563eb", "#7aa2e3", "#c7d7f4"][index] ||
      "#dbeafe",
  }));

  const growth =
    dashboard.userGrowth?.length > 0
      ? dashboard.userGrowth
      : [
          {
            name: "Start",
            users: dashboard.totalUsers || 0,
          },
        ];

  const recentAlerts = dashboard.recentAlerts || [];
  const activityPresentation = {
    CREATE: {
      label: "Created",
      Icon: Plus,
      color: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    },
    UPDATE: {
      label: "Updated",
      Icon: Pencil,
      color: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
    },
    DELETE: {
      label: "Deleted",
      Icon: Trash2,
      color: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
    },
  };

  const formatActivityTime = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Time unavailable"
      : new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date);
  };

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Overview"
    >
      {/* ================= ERROR ================= */}
      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-white px-5 py-4 text-sm font-bold text-amber-700 shadow-sm dark:border-amber-900/50 dark:bg-slate-900 dark:text-amber-300">
          {error}
        </div>
      )}

      {/* ================= LOADING ================= */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-lg font-bold text-slate-500">
            Chargement...
          </div>
        </div>
      ) : (
        <>
          {/* ================= STAT CARDS ================= */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              label="Total Users"
              value={dashboard.totalUsers || 0}
              icon={GraduationCap}
              color="blue"
            />

            <StatCard
              label="Active Courses"
              value={dashboard.activeCourses || 0}
              icon={GraduationCap}
              color="green"
            />

            <StatCard
              label="Quiz Completion"
              value={`${dashboard.quizCompletion || 0}%`}
              icon={CheckCircle}
              color="orange"
            />

            <StatCard
              label="Avg Grade"
              value={`${dashboard.avgGrade || 0}%`}
              icon={GraduationCap}
              color="purple"
            />

          </div>

          {/* ================= CHARTS ================= */}
          <div className="mt-8 grid gap-6 xl:grid-cols-2">

            {/* Platform Growth */}
            <Panel className="p-6">

              <h3 className="mb-5 text-2xl font-black text-slate-950 dark:text-white">
                Platform Growth
              </h3>

              <div className="h-72">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart data={growth}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                    />

                    <XAxis dataKey="name" />

                    <YAxis />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />

                  </LineChart>
                </ResponsiveContainer>

              </div>
            </Panel>

            {/* User Distribution */}
            <Panel className="p-6">

              <h3 className="mb-5 text-2xl font-black text-slate-950 dark:text-white">
                User Distribution
              </h3>

              {distribution.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={250}
                >
                  <PieChart>

                    <Pie
                      data={distribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                    >
                      {distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip />

                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-sm font-semibold text-slate-400">
                  No user distribution data
                </div>
              )}

            </Panel>

          </div>

          {/* ================= RECENT ALERTS ================= */}
          <Panel className="mt-8 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                  Latest recorded events
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                  Recent Alerts
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {recentAlerts.length} {recentAlerts.length === 1 ? "event" : "events"}
              </span>
            </div>

            {recentAlerts.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentAlerts.map((item) => {
                  const presentation = activityPresentation[item.action] || {
                    label: item.action || "Activity",
                    Icon: Activity,
                    color: "text-slate-600 dark:text-slate-400",
                    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                  };
                  const Icon = presentation.Icon;
                  const actor = item.user
                    ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() || item.user.email
                    : "User no longer available";

                  return (
                    <li
                      key={item._id}
                      className="flex flex-wrap items-center gap-4 px-6 py-4"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${presentation.color}`}>
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${presentation.badge}`}>
                            {presentation.label}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {item.entity || "Platform item"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          By <span className="font-semibold text-slate-700 dark:text-slate-300">{actor}</span>
                          {item.user?.role && ` · ${item.user.role}`}
                        </p>
                      </div>
                      <time
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400"
                        dateTime={item.createdAt}
                      >
                        <Clock3 aria-hidden="true" className="h-4 w-4" />
                        {formatActivityTime(item.createdAt)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {error ? <AlertTriangle aria-hidden="true" className="h-5 w-5" /> : <Activity aria-hidden="true" className="h-5 w-5" />}
                </div>
                <p className="mt-3 font-bold text-slate-800 dark:text-slate-200">
                  {error ? "Activity is unavailable" : "No recent activity"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {error
                    ? "Reconnect to the server to load recorded platform events."
                    : "New course, lesson, quiz, and user changes will appear here."}
                </p>
              </div>
            )}
          </Panel>
        </>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;