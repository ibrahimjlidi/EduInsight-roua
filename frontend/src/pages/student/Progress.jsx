import { useEffect, useState } from "react";
import { CheckCircle, Trophy } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardLayout from "../../layouts/DashboardLayout";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Panel from "../../components/Panel";
import StatCard from "../../components/StatCard";
import { getStudentDashboard } from "../../api/dashboardApi";
import { getMyInscriptions } from "../../api/inscriptionApi";

function Progress() {
  const [data, setData] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashboardData, inscriptionData] = await Promise.all([getStudentDashboard(), getMyInscriptions()]);
        setData(dashboardData);
        setInscriptions(inscriptionData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = data?.gradeHistory?.length ? data.gradeHistory : [{ name: "Start", score: data?.averageScore || 0 }];

  return (
    <DashboardLayout title="My Progress" subtitle="Grade tracking">
      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="mb-8 grid gap-5 md:grid-cols-2">
            <StatCard label="Courses Completed" value={data?.completedCourses || 0} icon={CheckCircle} color="green" />
            <StatCard label="Average Grade" value={`${data?.averageScore || 0}%`} icon={Trophy} color="blue" />
          </div>

          <Panel className="mb-6 p-6">
            <h2 className="mb-5 text-2xl font-black text-slate-950 dark:text-white">Grade History</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            {inscriptions.length === 0 ? (
              <EmptyState title="No progress yet" message="Enroll in a course to start tracking progress." />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-7 py-5 text-left font-black">Course</th>
                    <th className="px-7 py-5 text-left font-black">Grade</th>
                    <th className="px-7 py-5 text-left font-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inscriptions.map((item) => (
                    <tr key={item._id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/60">
                      <td className="px-7 py-4 font-black text-slate-950 dark:text-white">{item.course?.Title || "—"}</td>
                      <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{data?.averageScore || 0}%</td>
                      <td className="px-7 py-4"><Badge tone={item.status === "completed" ? "completed" : "available"}>{item.status === "completed" ? "Completed" : "In Progress"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      )}
    </DashboardLayout>
  );
}

export default Progress;
