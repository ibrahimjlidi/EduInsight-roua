import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CheckCircle, GraduationCap, Trophy } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Panel from "../../components/Panel";
import StatCard from "../../components/StatCard";
import { getAdminDashboard } from "../../api/dashboardApi";

const gradeData = [
  { name: "A", value: 300 },
  { name: "B", value: 450 },
  { name: "C", value: 200 },
  { name: "D", value: 100 },
  { name: "F", value: 50 },
];

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        setData(await getAdminDashboard());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completionData = [
    { name: "Completed", value: data?.completionRate || 0, color: "#2563eb" },
    { name: "In Progress", value: Math.max(100 - (data?.completionRate || 0) - 16, 0), color: "#7aa2e3" },
    { name: "Not Started", value: 16, color: "#d7d7d7" },
  ];

  return (
    <DashboardLayout title="Analytics" subtitle="Detailed reports">
      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="mb-8 grid gap-5 md:grid-cols-4">
            <StatCard label="Completion Rate" value={`${data?.completionRate || 0}%`} icon={CheckCircle} color="green" />
            <StatCard label="Avg Quiz Score" value={`${data?.avgGrade || 0}%`} icon={Trophy} color="orange" />
            <StatCard label="Active Students" value={data?.totalStudents || 0} icon={GraduationCap} color="blue" />
            <StatCard label="Courses" value={data?.totalCourses || 0} icon={BookOpen} color="purple" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel className="p-6">
              <h2 className="mb-5 text-2xl font-black text-slate-950 dark:text-white">Grade Distribution</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="p-6">
              <h2 className="mb-5 text-2xl font-black text-slate-950 dark:text-white">Course Completion</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={completionData} dataKey="value" outerRadius={100}>
                      {completionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default Analytics;
