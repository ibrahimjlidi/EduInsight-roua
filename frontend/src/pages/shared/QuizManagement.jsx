import { useCallback, useEffect, useState } from "react";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Panel from "../../components/Panel";
import SearchInput from "../../components/SearchInput";
import { createChoice, deleteChoice, getChoices, updateChoice } from "../../api/choiceApi";
import { getCourses } from "../../api/courseApi";
import { createQuestion, deleteQuestion, getQuestions, updateQuestion } from "../../api/questionApi";
import { createQuiz, deleteQuiz, getQuizzes, updateQuiz } from "../../api/quizApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  Title: "",
  Description: "",
  course: "",
  Duration: 15,
  isPublished: true,
};

const emptyQuestionForm = {
  Statement: "",
  Type: "MCQ",
  Points: 1,
  Order: 1,
  choices: [
    { Text: "", isCorrect: true },
    { Text: "", isCorrect: false },
    { Text: "", isCorrect: false },
    { Text: "", isCorrect: false },
  ],
};

function QuizManagement({ role = "admin" }) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
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

  const loadQuestions = async (quiz) => {
    setActiveQuiz(quiz);
    setEditingQuestion(null);
    setQuestionForm({ ...emptyQuestionForm, Order: 1 });
    setQuestionModalOpen(true);
    try {
      const data = await getQuestions({ quiz: quiz._id });
      const quizQuestions = data.questions || data;
      const rows = await Promise.all(
        quizQuestions.map(async (question) => {
          const choiceData = await getChoices({ question: question._id });
          return { ...question, choices: choiceData.choices || choiceData };
        })
      );
      setQuestions(rows);
      setQuestionForm({ ...emptyQuestionForm, Order: rows.length + 1 });
    } catch (err) {
      alert(err.response?.data?.message || "Questions loading failed");
    }
  };

  const setChoiceText = (index, Text) => {
    setQuestionForm((current) => ({
      ...current,
      choices: current.choices.map((choice, idx) => (idx === index ? { ...choice, Text } : choice)),
    }));
  };

  const setCorrectChoice = (index) => {
    setQuestionForm((current) => ({
      ...current,
      choices: current.choices.map((choice, idx) => ({ ...choice, isCorrect: idx === index })),
    }));
  };

  const editQuestion = (question) => {
    const filledChoices = [...(question.choices || [])];
    while (filledChoices.length < 4) {
      filledChoices.push({ Text: "", isCorrect: false });
    }
    setEditingQuestion(question);
    setQuestionForm({
      Statement: question.Statement || "",
      Type: question.Type || "MCQ",
      Points: question.Points || 1,
      Order: question.Order || 1,
      choices: filledChoices.slice(0, 4).map((choice, index) => ({
        _id: choice._id,
        Text: choice.Text || "",
        isCorrect: choice.isCorrect === true || (!filledChoices.some((item) => item.isCorrect) && index === 0),
      })),
    });
  };

  const saveQuestion = async (event) => {
    event.preventDefault();
    if (!activeQuiz?._id) return;

    const cleanChoices = questionForm.choices.filter((choice) => choice.Text.trim());
    if (cleanChoices.length < 2) {
      alert("Add at least two choices.");
      return;
    }

    try {
      const payload = {
        quiz: activeQuiz._id,
        Statement: questionForm.Statement,
        Type: questionForm.Type,
        Points: Number(questionForm.Points) || 1,
        Order: Number(questionForm.Order) || questions.length + 1,
      };
      const question = editingQuestion
        ? await updateQuestion(editingQuestion._id, payload)
        : await createQuestion(payload);

      await Promise.all(
        cleanChoices.map((choice, index) => {
          const choicePayload = {
            question: question._id,
            Text: choice.Text,
            isCorrect: choice.isCorrect,
            Order: index + 1,
          };
          return choice._id ? updateChoice(choice._id, choicePayload) : createChoice(choicePayload);
        })
      );
      await Promise.all(
        questionForm.choices
          .filter((choice) => choice._id && !choice.Text.trim())
          .map((choice) => deleteChoice(choice._id))
      );

      await loadQuestions(activeQuiz);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Question save failed");
    }
  };

  const removeQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(id);
      await loadQuestions(activeQuiz);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Question delete failed");
    }
  };

  return (
    <DashboardLayout title="Quizzes" subtitle="Assessments">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search quizzes..." />
        <button onClick={openCreate} className="action-button inline-flex items-center justify-center gap-2">
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
                        <button onClick={() => openEdit(quiz)} className="icon-action bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => loadQuestions(quiz)} className="icon-action bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <ListChecks className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(quiz._id)} className="icon-action bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300">
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
          <button disabled={saving || courses.length === 0} className="action-button disabled:opacity-60">
            {saving ? "Saving..." : "Save Quiz"}
          </button>
        </form>
      </Modal>

      <Modal open={questionModalOpen} title={`Questions · ${activeQuiz?.Title || ""}`} onClose={() => setQuestionModalOpen(false)}>
        <div className="grid max-h-[76vh] gap-5 overflow-y-auto pr-1">
          <form onSubmit={saveQuestion} className="grid gap-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/70">
            <input className="form-input" placeholder="Question statement" value={questionForm.Statement} onChange={(e) => setQuestionForm({ ...questionForm, Statement: e.target.value })} required />
            <div className="grid gap-3 md:grid-cols-3">
              <select className="form-input" value={questionForm.Type} onChange={(e) => setQuestionForm({ ...questionForm, Type: e.target.value })}>
                <option value="MCQ">MCQ</option>
                <option value="TrueFalse">True / False</option>
              </select>
              <input className="form-input" type="number" min="1" value={questionForm.Points} onChange={(e) => setQuestionForm({ ...questionForm, Points: e.target.value })} />
              <input className="form-input" type="number" min="1" value={questionForm.Order} onChange={(e) => setQuestionForm({ ...questionForm, Order: e.target.value })} />
            </div>
            <div className="grid gap-3">
              {questionForm.choices.map((choice, index) => (
                <label key={index} className="flex items-center gap-3">
                  <input type="radio" checked={choice.isCorrect} onChange={() => setCorrectChoice(index)} />
                  <input className="form-input" placeholder={`Choice ${index + 1}`} value={choice.Text} onChange={(e) => setChoiceText(index, e.target.value)} />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="action-button">{editingQuestion ? "Update question" : "Add question"}</button>
              {editingQuestion && (
                <button type="button" onClick={() => { setEditingQuestion(null); setQuestionForm({ ...emptyQuestionForm, Order: questions.length + 1 }); }} className="rounded-full bg-white px-5 py-3 font-black text-slate-600 shadow-sm transition hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300">
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="grid gap-3">
            {questions.length === 0 ? (
              <EmptyState title="No questions" message="Add the first question for this quiz." />
            ) : (
              questions.map((question) => (
                <div key={question._id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-blue-500">Order {question.Order || 1} · {question.Points || 1} pts</p>
                      <h3 className="mt-1 font-black text-slate-950 dark:text-white">{question.Statement}</h3>
                      <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{(question.choices || []).map((choice) => choice.Text).join(" · ")}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editQuestion(question)} className="icon-action bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeQuestion(question._id)} className="icon-action bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default QuizManagement;
