import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Panel from "../../components/Panel";
import { getMyInscriptions } from "../../api/inscriptionApi";
import { getQuizzes } from "../../api/quizApi";

function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [quizData, inscriptionData] = await Promise.all([getQuizzes(), getMyInscriptions()]);
        setQuizzes(quizData.filter((quiz) => quiz.isPublished !== false));
        setInscriptions(inscriptionData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const rows = useMemo(() => {
    const enrolledCourses = new Set(inscriptions.map((item) => String(item.course?._id || item.course)));
    return quizzes.filter((quiz) => enrolledCourses.has(String(quiz.course?._id || quiz.course)));
  }, [quizzes, inscriptions]);

  return (
    <DashboardLayout title="My Quizzes" subtitle="Test yourself">
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Chargement...</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No quizzes yet" message="Enroll in courses to unlock quizzes." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-7 py-5 text-left font-black">Course</th>
                <th className="px-7 py-5 text-left font-black">Quiz</th>
                <th className="px-7 py-5 text-left font-black">Questions</th>
                <th className="px-7 py-5 text-left font-black">Best Score</th>
                <th className="px-7 py-5 text-left font-black">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((quiz) => (
                <tr key={quiz._id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/60">
                  <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{quiz.course?.Title || "—"}</td>
                  <td className="px-7 py-4 font-black text-slate-950 dark:text-white">{quiz.Title}</td>
                  <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{quiz.questionCount || 0}</td>
                  <td className="px-7 py-4 text-slate-700 dark:text-slate-300">—</td>
                  <td className="px-7 py-4">
                    <button className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">Start</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </DashboardLayout>
  );
}

export default StudentQuizzes;
