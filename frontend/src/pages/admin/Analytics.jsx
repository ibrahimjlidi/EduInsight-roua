import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CheckCircle, GraduationCap, Sparkles, Trophy } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Panel from "../../components/Panel";
import StatCard from "../../components/StatCard";
import { getAdminAiInsights, getAdminDashboard } from "../../api/dashboardApi";

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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

  const generateInsights = useCallback(async () => {
    setAiLoading(true);
    setAiError("");
    try {
      setAiInsights(await getAdminAiInsights());
    } catch (err) {
      console.error("Failed to generate AI analytics:", err);
      setAiError(err.response?.data?.message || "Could not generate AI insights. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }, []);

  const gradeData = data?.gradeDistribution?.length
    ? data.gradeDistribution
    : [{ name: "No attempts", value: 0 }];
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#a855f7", "#d7d7d7"];
  const completionData = (data?.courseCompletion?.length ? data.courseCompletion : [])
    .map((item, index) => ({ ...item, color: colors[index % colors.length] }));

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

          <Panel className="mb-8 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
                  <Sparkles className="h-5 w-5 text-cyan-500" />
                  AI learning insights
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Evidence-based analysis of aggregated course and quiz performance.
                </p>
              </div>
              <button
                type="button"
                onClick={generateInsights}
                disabled={aiLoading}
                className="action-button inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
              >
                <Sparkles className={`h-4 w-4 ${aiLoading ? "animate-pulse" : ""}`} />
                {aiLoading ? "Analyzing..." : aiInsights ? "Refresh insights" : "Generate insights"}
              </button>
            </div>
            {aiError && (
              <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-200">
                {aiError}
              </p>
            )}
            {aiInsights && (
              <div className="mt-5 space-y-4">
                <p className="rounded-xl bg-cyan-50 p-4 text-sm font-semibold leading-6 text-slate-700 dark:bg-cyan-400/10 dark:text-slate-200">
                  {aiInsights.summary}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {aiInsights.insights.map((insight, index) => (
                    <article key={`${insight.title}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="font-black text-slate-900 dark:text-white">{insight.title}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black capitalize ${
                          insight.priority === "high"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                            : insight.priority === "medium"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{insight.description}</p>
                    </article>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Generated {new Date(aiInsights.generatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </Panel>

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
