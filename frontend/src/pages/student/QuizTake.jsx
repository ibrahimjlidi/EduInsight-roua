import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, ClipboardCheck, Loader2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Panel from "../../components/Panel";
import { getQuizForTaking } from "../../api/quizApi";
import { startQuizAttempt, submitQuizAttempt } from "../../api/quizAttemptApi";

function QuizTake() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const data = await getQuizForTaking(quizId);
        setQuiz(data);
        setAttempt(await startQuizAttempt(quizId));
      } catch (err) {
        setResult({ error: err.response?.data?.message || "Quiz unavailable." });
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const completed = useMemo(() => {
    const questions = quiz?.questions || [];
    if (!questions.length) return false;
    return questions.every((question) => answers[question._id]);
  }, [answers, quiz]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!attempt?._id || !completed) return;
    setSaving(true);
    try {
      const payload = quiz.questions.map((question) => ({
        questionId: question._id,
        selectedChoiceId: answers[question._id],
      }));
      setResult(await submitQuizAttempt(attempt._id, payload));
    } catch (err) {
      setResult({ error: err.response?.data?.message || "Submit failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={quiz?.Title || "Quiz"} subtitle={quiz?.course?.Title || "Assessment"}>
      <Link to="/student/quizzes" className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-blue-600 dark:bg-slate-950 dark:text-slate-300">
        <ArrowLeft className="h-4 w-4" />
        Back to quizzes
      </Link>

      {loading ? (
        <Panel className="flex items-center gap-3 p-8 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement...
        </Panel>
      ) : result?.error ? (
        <EmptyState title="Quiz not available" message={result.error} />
      ) : result?.attempt ? (
        <Panel className="overflow-hidden p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle className="h-10 w-10" />
          </div>
          <p className="text-sm font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Score saved in MongoDB</p>
          <h2 className="mt-2 text-5xl font-black text-slate-950 dark:text-white">{result.score}%</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {result.score >= 70 ? "Course completed. Your certificate is ready." : "Attempt saved. You can revise and try again later."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/student/progress" className="action-button">View progress</Link>
            {result.score >= 70 && <Link to="/student/certificates" className="rounded-full bg-amber-100 px-5 py-3 font-black text-amber-700 transition hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-200">Certificate</Link>}
          </div>
        </Panel>
      ) : !quiz?.questions?.length ? (
        <EmptyState title="No questions yet" message="This quiz has no questions configured by the teacher." />
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5">
          <Panel className="relative overflow-hidden p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#10b981,#f59e0b,#a855f7,#2563eb)] bg-200% animate-gradient-move" />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">{quiz.Title}</h2>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{quiz.questions.length} questions · {quiz.Duration || 15} min</p>
              </div>
            </div>
          </Panel>

          {quiz.questions.map((question, index) => (
            <Panel key={question._id} className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-500">Question {index + 1}</p>
                  <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{question.Statement}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">{question.Points || 1} pts</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(question.choices || []).map((choice) => (
                  <label key={choice._id} className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-4 font-bold transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 ${answers[question._id] === choice._id ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/10 dark:bg-blue-500/15 dark:text-blue-200" : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"}`}>
                    <input
                      type="radio"
                      name={question._id}
                      className="h-4 w-4"
                      checked={answers[question._id] === choice._id}
                      onChange={() => setAnswers((current) => ({ ...current, [question._id]: choice._id }))}
                    />
                    {choice.Text}
                  </label>
                ))}
              </div>
            </Panel>
          ))}

          <button disabled={!completed || saving} className="action-button w-fit disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Submitting..." : "Submit answers"}
          </button>
        </form>
      )}
    </DashboardLayout>
  );
}

export default QuizTake;
