// src/pages/student/Courses.jsx
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import SearchInput from "../../components/SearchInput";
import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import Panel from "../../components/Panel";
import { getCourses } from "../../api/courseApi";
import { getMyInscriptions, enrollInCourse } from "../../api/inscriptionApi";
import { getStudentDashboard } from "../../api/dashboardApi";
import { BookOpen, CheckCircle, Trophy } from "lucide-react";

function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 5 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesData, inscriptionsData, statsData] = await Promise.all([
        getCourses({ page, limit: 5, search }),
        getMyInscriptions(),
        getStudentDashboard(),
      ]);
      setCourses(coursesData.courses || coursesData);
      setPagination({
        page: coursesData.page || 1,
        pages: coursesData.pages || 1,
        total: coursesData.total || (Array.isArray(coursesData) ? coursesData.length : 0),
        limit: coursesData.limit || 5,
      });
      setInscriptions(inscriptionsData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getStatusForCourse = (courseId) => {
    const inscription = inscriptions.find((i) => (i.course?._id || i.course) === courseId);
    if (!inscription) return "available";
    return inscription.status; // "active" | "completed" | "dropped"
  };

  const handleEnroll = async (courseId) => {
    try {
      await enrollInCourse(courseId);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  const enrolledCount = inscriptions.filter((i) => i.status === "active").length;
  const completedCount = inscriptions.filter((i) => i.status === "completed").length;

  return (
    <DashboardLayout title="My Courses" subtitle="Enroll & learn">
      <div className="grid gap-5 mb-8 md:grid-cols-3">
        <StatCard label="Enrolled" value={enrolledCount} icon={BookOpen} color="blue" />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle} color="green" />
        <StatCard label="Avg Grade" value={`${stats?.averageScore || 0}%`} icon={Trophy} color="purple" />
      </div>

      <div className="mb-6">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search a course..." />
      </div>

      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500 dark:text-slate-400">Chargement...</p>
        ) : courses.length === 0 ? (
          <EmptyState title="Aucun cours trouvé" message="No course matches the current search." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left px-7 py-5 font-black">Course</th>
                  <th className="text-left px-7 py-5 font-black">Instructor</th>
                  <th className="text-left px-7 py-5 font-black">Status</th>
                  <th className="text-right px-7 py-5 font-black">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {courses.map((c) => {
                  const status = getStatusForCourse(c._id);
                  return (
                    <tr key={c._id} className="text-slate-700 transition hover:bg-blue-50/40 dark:text-slate-300 dark:hover:bg-slate-900/60">
                      <td className="px-7 py-4 font-black text-slate-950 dark:text-white">{c.Title}</td>
                      <td className="px-7 py-4">
                        {c.Teacher?.firstName ? `${c.Teacher.firstName} ${c.Teacher.lastName}` : "—"}
                      </td>
                      <td className="px-7 py-4">
                        <Badge tone={status === "active" ? "student" : status === "completed" ? "completed" : "available"}>
                          {status === "active" ? "Enrolled" : status === "completed" ? "Completed" : "Available"}
                        </Badge>
                      </td>
                      <td className="px-7 py-4 text-right">
                        {status === "available" ? (
                          <button
                            onClick={() => handleEnroll(c._id)}
                            className="action-button px-4 py-2 text-sm"
                          >
                            Enroll
                          </button>
                        ) : status === "completed" ? (
                          <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-blue-600 dark:bg-slate-800 dark:text-blue-300">
                            Review
                          </button>
                        ) : (
                          <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-blue-600 dark:bg-slate-800 dark:text-blue-300">
                            Continue
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination {...pagination} onPageChange={setPage} />
          </>
        )}
      </Panel>
    </DashboardLayout>
  );
}

export default StudentCourses;
