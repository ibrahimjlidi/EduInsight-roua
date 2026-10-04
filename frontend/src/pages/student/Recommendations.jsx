import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, RefreshCw, Sparkles } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Panel from "../../components/Panel";
import { getPersonalizedRecommendations } from "../../api/recommendationApi";

function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPersonalizedRecommendations();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Failed to load AI recommendations:", err);
      setError(err.response?.data?.message || "Could not load recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <DashboardLayout title="Recommendations" subtitle="AI-powered study guidance">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-300">
          Suggestions are based on your enrolled courses and submitted quiz results.
        </p>
        <button
          type="button"
          onClick={loadRecommendations}
          disabled={loading}
          className="action-button inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh recommendations
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800 dark:border-amber-900/50 dark:bg-slate-900 dark:text-amber-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm font-semibold text-slate-500">Generating your recommendations...</div>
      ) : recommendations.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {recommendations.map((recommendation, index) => (
            <Panel key={`${recommendation.title}-${index}`} className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300">
                  {recommendation.type === "course" ? <BookOpen className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </span>
                <div>
                  <h2 className="font-black text-slate-900 dark:text-white">{recommendation.title}</h2>
                  <p className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                    {recommendation.type.replace("_", " ")}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{recommendation.message}</p>
              {recommendation.courseTitle && (
                <Link
                  to="/student/courses"
                  className="mt-4 block rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
                >
                  Explore course: {recommendation.courseTitle}
                </Link>
              )}
            </Panel>
          ))}
        </div>
      ) : !error ? (
        <Panel className="p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-cyan-500" />
          <p className="font-bold text-slate-700 dark:text-slate-200">No recommendations are available yet.</p>
          <p className="mt-2 text-sm text-slate-500">Enroll in a course or submit a quiz, then refresh.</p>
        </Panel>
      ) : null}
    </DashboardLayout>
  );
}

export default Recommendations;
