// src/pages/dashboard/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { BookOpen, Trophy, CalendarCheck, Rocket } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/StatCard";
import { getStudentDashboard } from "../../api/dashboardApi";

function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const res = await getStudentDashboard();
        setData(res);
      } catch (err) {
        console.error("Erreur chargement dashboard student", err);
        setError("Backend unavailable. Start the API server and refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout title="Student Dashboard" subtitle="My Progress">
      {loading ? (
        <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
      ) : (
        <>
          {error && (
            <div className="mb-6 rounded-[1.35rem] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {error}
            </div>
          )}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Courses" value={data?.totalCourses || 0} icon={BookOpen} color="cyan" />
            <StatCard label="Average" value={`${data?.averageScore || 0}%`} icon={Trophy} color="green" />
            <StatCard label="Attendance" value={`${data?.attendanceRate || 0}%`} icon={CalendarCheck} color="blue" />
            <StatCard label="Progress" value={`${data?.progress || 0}%`} icon={Rocket} color="purple" />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
