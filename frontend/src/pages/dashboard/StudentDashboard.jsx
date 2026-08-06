// src/pages/dashboard/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { BookOpen, Trophy, CalendarCheck, Rocket } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/StatCard";
import { getStudentDashboard } from "../../api/dashboardApi";

function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStudentDashboard();
        setData(res);
      } catch (err) {
        console.error("Erreur chargement dashboard student", err);
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
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Courses" value={data.totalCourses} icon={BookOpen} color="cyan" />
          <StatCard label="Average" value={`${data.averageScore}%`} icon={Trophy} color="green" />
          <StatCard label="Attendance" value={`${data.attendanceRate}%`} icon={CalendarCheck} color="blue" />
          <StatCard label="Progress" value={`${data.progress}%`} icon={Rocket} color="purple" />
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;