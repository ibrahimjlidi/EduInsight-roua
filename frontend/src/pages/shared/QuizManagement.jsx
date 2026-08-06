import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Panel from "../../components/Panel";
import SearchInput from "../../components/SearchInput";
import { getCourses } from "../../api/courseApi";
import { createQuiz, deleteQuiz, getQuizzes, updateQuiz } from "../../api/quizApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  Title: "",
  Description: "",
  course: "",
  Duration: 15,
  isPublished: true,
};

function QuizManagement({ role = "admin" }) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 5 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const teacherId = user?._id || user?.id;
      const [quizData, courseData] = await Promise.all([
        getQuizzes({
          page,
          limit: 5,
          search,
          ...(role === "teacher" && teacherId ? { teacher: teacherId } : {}),
        }),
        getCourses(),
      ]);
      const visibleCourses =
        role === "teacher"
          ? courseData.filter((course) => String(course.Teacher?._id || course.Teacher) === String(teacherId))
          : courseData;

      setCourses(visibleCourses);
      setQuizzes(quizData.quizzes || quizData);
      setPagination({
        page: quizData.page || 1,
        pages: quizData.pages || 1,
        total: quizData.total || (Array.isArray(quizData) ? quizData.length : 0),
        limit: quizData.limit || 5,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, role, search, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, course: courses[0]?._id || "" });
    setModalOpen(true);
  };

  const openEdit = (quiz) => {
    setEditing(quiz);
    setForm({
      Title: quiz.Title || "",
      Description: quiz.Description || "",
      course: quiz.course?._id || quiz.course || "",
      Duration: quiz.Duration || 15,
      isPublished: quiz.isPublished !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateQuiz(editing._id, form);
      } else {
        await createQuiz(form);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Quiz save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await deleteQuiz(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Quiz delete failed");
    }
  };

  return (
    <DashboardLayout title="Quizzes" subtitle="Assessments">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search quizzes..." />
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500">
          <Plus className="h-4 w-4" />
          Create Quiz
        </button>
      </div>

      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Chargement...</p>
        ) : quizzes.length === 0 ? (
          <EmptyState title="No quizzes" message="Create quizzes and they will appear here." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-7 py-5 text-left font-black">Quiz</th>
                  <th className="px-7 py-5 text-left font-black">Course</th>
                  <th className="px-7 py-5 text-left font-black">Questions</th>
                  <th className="px-7 py-5 text-left font-black">Status</th>
                  <th className="px-7 py-5 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quizzes.map((quiz) => (
                  <tr key={quiz._id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/60">
                    <td className="px-7 py-4 font-black text-slate-950 dark:text-white">{quiz.Title}</td>
                    <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{quiz.course?.Title || "—"}</td>
                    <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{quiz.questionCount || 0}</td>
                    <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{quiz.isPublished ? "Published" : "Draft"}</td>
                    <td className="px-7 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(quiz)} className="rounded-full bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(quiz._id)} className="rounded-full bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination {...pagination} onPageChange={setPage} />
          </>
        )}
      </Panel>

      <Modal open={modalOpen} title={editing ? "Edit Quiz" : "Create Quiz"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input className="form-input" placeholder="Quiz title" value={form.Title} onChange={(e) => setForm({ ...form, Title: e.target.value })} required />
          <textarea className="form-input min-h-24" placeholder="Description" value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} />
          <div className="grid gap-4 md:grid-cols-2">
            <select className="form-input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required>
              <option value="">Choose course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.Title}</option>
              ))}
            </select>
            <input className="form-input" type="number" min="1" placeholder="Duration minutes" value={form.Duration} onChange={(e) => setForm({ ...form, Duration: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Published
          </label>
          <button disabled={saving || courses.length === 0} className="rounded-full bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-500 disabled:opacity-60">
            {saving ? "Saving..." : "Save Quiz"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default QuizManagement;
