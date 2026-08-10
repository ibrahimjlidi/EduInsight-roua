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
  AlertTriangle,
  CheckCircle,
  GraduationCap,
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
          <Panel className="mt-8 p-6">

            <h3 className="mb-4 text-2xl font-black text-slate-950 dark:text-white">
              Recent Alerts
            </h3>

            <ul className="space-y-3 text-base font-semibold text-slate-700 dark:text-slate-300">

              <li className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />

                Completion alert:
                <span className="font-black">
                  {dashboard.completionRate < 70
                    ? "Review recommended"
                    : "Healthy"}
                </span>
              </li>

              <li className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-blue-500" />

                Registered learners:
                <span className="font-black">
                  {dashboard.totalStudents}
                </span>
              </li>

              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />

                Server health:
                <span className="font-black text-emerald-600">
                  Optimal
                </span>
              </li>

            </ul>

          </Panel>
        </>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;