// src/pages/dashboard/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BookOpen, CheckCircle, GraduationCap, Trophy, Users } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Panel from "../../components/Panel";
import StatCard from "../../components/StatCard";
import { getAdminDashboard } from "../../api/dashboardApi";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAdminDashboard();
        setData(res);
      } catch (err) {
        console.error("Erreur chargement dashboard admin", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const distribution = (data?.roleDistribution || []).map((item, index) => ({
    ...item,
    color: ["#2563eb", "#7aa2e3", "#c7d7f4"][index] || "#dbeafe",
  }));
  const growth = data?.userGrowth?.length ? data.userGrowth : [{ name: "Start", users: data?.totalUsers || 0 }];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Overview">
      {loading ? (
        <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : (
        <>
          <div className="mb-8 grid gap-5 md:grid-cols-4">
            <StatCard label="Total Users" value={data.totalUsers} icon={Users} color="blue" hint="Live" />
            <StatCard label="Active Courses" value={data.activeCourses} icon={BookOpen} color="green" />
            <StatCard label="Quiz Completion" value={`${data.quizCompletion || 0}%`} icon={CheckCircle} color="orange" />
            <StatCard
              label="Avg Grade"
              value={`${data.avgGrade || 0}%`}
              icon={Trophy}
              color="purple"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel className="p-6">
              <h3 className="mb-5 text-2xl font-black text-slate-950 dark:text-white">Platform Growth</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="p-6">
              <h3 className="mb-5 text-2xl font-black text-slate-950 dark:text-white">User Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={distribution} dataKey="value" innerRadius={60} outerRadius={90}>
                    {distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <Panel className="mt-8 p-6">
              <h3 className="mb-3 text-2xl font-black text-slate-950 dark:text-white">Recent Alerts</h3>
              <ul className="space-y-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Completion alert: {data.completionRate < 70 ? "Review recommended" : "Healthy"}</li>
                <li className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-500" /> Registered learners: {data.totalStudents}</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" /> Server health: Optimal</li>
              </ul>
          </Panel>
        </>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;
