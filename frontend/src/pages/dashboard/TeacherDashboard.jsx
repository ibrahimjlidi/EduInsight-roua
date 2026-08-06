// src/pages/dashboard/TeacherDashboard.jsx
import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, HelpCircle } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/StatCard";
import { getTeacherDashboard } from "../../api/dashboardApi";

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getTeacherDashboard();
        setData(res);
      } catch (err) {
        console.error("Erreur chargement dashboard teacher", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout title="Teacher Dashboard" subtitle="Overview">
      {loading ? (
        <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="My Courses" value={data.totalCourses} icon={BookOpen} color="cyan" />
            <StatCard label="Students" value={data.totalStudents} icon={GraduationCap} color="green" />
            <StatCard label="Quizzes" value={data.courses?.length || 0} icon={HelpCircle} color="orange" />
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-colors">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">My Courses</h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.courses?.map((c) => (
                <li key={c.id} className="py-3 text-sm text-slate-700 dark:text-slate-300">
                  {c.title}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default TeacherDashboard;