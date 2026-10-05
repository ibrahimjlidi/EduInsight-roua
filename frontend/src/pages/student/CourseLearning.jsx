import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, Circle, Loader2, PlayCircle, Sparkles, Trophy } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Panel from "../../components/Panel";
import { askCourseTutor, completeCourseLesson, getCourseLearning } from "../../api/courseLearningApi";

const uploadsBase = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");

const getLessonContentBlocks = (content) => {
  if (typeof content !== "string") return [];
  const readableContent = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\r/g, "");

  return readableContent.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean);
};

const getSafeResourceUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const getYoutubeEmbedUrl = (value) => {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    let videoId = "";
    if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      videoId = url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    }
    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
};

function CourseLearning() {
  const { courseId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const recommendedLessonId = searchParams.get("lessonId");
  const [data, setData] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingLesson, setSavingLesson] = useState("");
  const [error, setError] = useState("");

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getCourseLearning(courseId));
    } catch (err) {
      console.error("Failed to load course:", err);
      setError(err.response?.data?.message || "Could not load this course. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleCompleteLesson = async (lessonId) => {
    setSavingLesson(lessonId);
    setError("");
    try {
      await completeCourseLesson(courseId, lessonId);
      await loadCourse();
    } catch (err) {
      console.error("Failed to save lesson progress:", err);
      setError(err.response?.data?.message || "Could not save lesson progress.");
    } finally {
      setSavingLesson("");
    }
  };

  const lessons = useMemo(
    () => data?.modules?.flatMap((module) => (
      (module.lessons || []).map((lesson) => ({
        ...lesson,
        moduleTitle: module.Title,
      }))
    )) || [],
    [data]
  );
  const activeLessonIndex = lessons.findIndex((lesson) => String(lesson._id) === activeLessonId);
  const activeLesson = activeLessonIndex >= 0 ? lessons[activeLessonIndex] : lessons[0];
  const nextLesson = lessons.find((lesson) => !lesson.isCompleted) || lessons[0];

  const openLesson = (lessonId) => {
    setActiveLessonId(String(lessonId));
    window.requestAnimationFrame(() => {
      document.getElementById("lesson-reader")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    if (recommendedLessonId && lessons.some((lesson) => String(lesson._id) === recommendedLessonId)) {
      if (activeLessonId !== recommendedLessonId) setActiveLessonId(recommendedLessonId);
    } else if (!activeLessonId && lessons.length) {
      setActiveLessonId(String(lessons[0]._id));
    } else if (activeLessonId && !lessons.some((lesson) => String(lesson._id) === activeLessonId)) {
      setActiveLessonId(lessons.length ? String(lessons[0]._id) : "");
    }
  }, [activeLessonId, lessons, recommendedLessonId]);

  useEffect(() => {
    const targetId = location.hash.slice(1);
    if (!data || !targetId) return;
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [data, location.hash]);

  return (
    <DashboardLayout title={data?.course?.Title || "Course"} subtitle="Your learning path">
      <Link to="/student/courses" className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:text-blue-600 dark:bg-slate-950 dark:text-slate-300">
        <ArrowLeft className="h-4 w-4" />
        My Courses
      </Link>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800 dark:border-amber-900/50 dark:bg-slate-900 dark:text-amber-300">
          {error}
        </div>
      )}
      {loading ? (
        <Panel className="flex items-center gap-3 p-8 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your course...
        </Panel>
      ) : !data ? (
        <EmptyState title="Course unavailable" message={error || "This course could not be loaded."} />
      ) : (
        <div className="grid gap-6">
          <Panel className="overflow-hidden p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-blue-600">{data.course.Level || "Course"}</p>
                <h1 className="text-3xl font-black text-slate-950 dark:text-white">{data.course.Title}</h1>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{data.course.Description}</p>
                <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Instructor: {data.course.Teacher?.firstName} {data.course.Teacher?.lastName}
                </p>
              </div>
              {data.certificate && (
                <Link to="/student/certificates" className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                  <Trophy className="h-5 w-5" /> Certificate earned
                </Link>
              )}
            </div>
            {lessons.length > 0 && (
              <button
                type="button"
                onClick={() => openLesson(nextLesson._id)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
              >
                <PlayCircle className="h-5 w-5" />
                {data.progress.completedLessons ? "Continue lesson" : "Start lesson"}
              </button>
            )}
            <div className="mt-7">
              <div className="mb-2 flex justify-between text-sm font-black text-slate-600 dark:text-slate-300">
                <span>Lesson progress</span>
                <span>{data.progress.completedLessons}/{data.progress.totalLessons} · {data.progress.percentage}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${data.progress.percentage}%` }} />
              </div>
            </div>
          </Panel>

          {(data.course.Pdf || data.resources?.length > 0 || lessons.some((lesson) => lesson.PdfUrl)) && (
            <Panel className="p-6">
              <h2 className="mb-4 text-lg font-black text-slate-950 dark:text-white">Course resources</h2>
              <div className="flex flex-wrap gap-3">
                {data.course.Pdf && (
                  <a
                    href={`${uploadsBase}/uploads/courses/${encodeURIComponent(data.course.Pdf)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                  >
                    Course PDF
                  </a>
                )}
                {(data.resources || []).map((resource) => (
                  <a
                    key={resource._id}
                    href={`${uploadsBase}/uploads/docs/${encodeURIComponent(resource.fileName)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                  >
                    {resource.title}
                    {resource.description && <span className="mt-1 block max-w-xs truncate text-xs font-medium">{resource.description}</span>}
                  </a>
                ))}
                {lessons.filter((lesson) => lesson.PdfUrl).map((lesson) => {
                  const pdfUrl = getSafeResourceUrl(lesson.PdfUrl);
                  return pdfUrl ? (
                    <a
                      key={lesson._id}
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                    >
                      {lesson.Title} PDF
                    </a>
                  ) : null;
                })}
              </div>
            </Panel>
          )}

          {lessons.length === 0 && (
            <Panel className="p-6">
              <p className="font-bold text-slate-700 dark:text-slate-200">This course has no lessons yet.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ask the course instructor to add modules and lesson content. Quizzes unlock after all course lessons are added and completed.</p>
            </Panel>
          )}

          {lessons.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Lessons</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lessons.length} lessons in this course. Select one to start reading.</p>
            </div>
          )}

          {data.modules.map((module) => (
            <Panel key={module._id} className="p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">{module.Title}</h2>
                  {module.Description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{module.Description}</p>}
                  <p className="mt-1 text-xs font-bold text-slate-400">{module.lessons.length} lessons</p>
                </div>
              </div>
              <div className="grid gap-2">
                {module.lessons.map((lesson, index) => {
                  return (
                    <button
                      type="button"
                      key={lesson._id}
                      onClick={() => openLesson(lesson._id)}
                      aria-current={String(lesson._id) === String(activeLesson?._id) ? "page" : undefined}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                        String(lesson._id) === String(activeLesson?._id)
                          ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {lesson.isCompleted
                          ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                          : <Circle className="h-5 w-5 shrink-0 text-slate-400" />}
                        <span className="min-w-0">
                          <span className="block text-xs font-black uppercase tracking-wide text-blue-500">Lesson {index + 1}</span>
                          <span className="mt-1 block truncate font-black text-slate-900 dark:text-white">{lesson.Title}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-black text-blue-600 dark:text-blue-300">Start lesson →</span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          ))}

          {activeLesson && (
            <div id="lesson-reader" className="scroll-mt-6">
              <Panel className="overflow-hidden p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-500">{activeLesson.moduleTitle} · Lesson {activeLessonIndex + 1}</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{activeLesson.Title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleCompleteLesson(activeLesson._id)}
                  disabled={activeLesson.isCompleted || savingLesson === activeLesson._id}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${
                    activeLesson.isCompleted
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                  } disabled:cursor-default`}
                >
                  {savingLesson === activeLesson._id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : activeLesson.isCompleted ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {activeLesson.isCompleted ? "Lesson completed" : "Mark lesson complete"}
                </button>
              </div>
              {activeLesson.Content && (
                <div className="mt-6 grid gap-4 text-base leading-8 text-slate-700 dark:text-slate-300">
                  {getLessonContentBlocks(activeLesson.Content).map((block, index) => block.startsWith("## ") ? (
                    <h3 key={`heading-${index}`} className="mt-2 text-lg font-black leading-7 text-slate-950 dark:text-white">
                      {block.slice(3)}
                    </h3>
                  ) : (
                    <p key={`paragraph-${index}`} className="whitespace-pre-line">{block}</p>
                  ))}
                </div>
              )}
              {getYoutubeEmbedUrl(activeLesson.VideoUrl) && (
                <div className="mt-6 overflow-hidden rounded-2xl bg-slate-950">
                  <div className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-white">
                    <PlayCircle className="h-4 w-4 text-red-400" /> Lesson video
                  </div>
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={getYoutubeEmbedUrl(activeLesson.VideoUrl)}
                      title={`${activeLesson.Title} video`}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveLessonId(String(lessons[activeLessonIndex - 1]?._id || ""))}
                  disabled={activeLessonIndex <= 0}
                  className="rounded-full bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200"
                >
                  ← Previous lesson
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLessonId(String(lessons[activeLessonIndex + 1]?._id || ""))}
                  disabled={activeLessonIndex >= lessons.length - 1}
                  className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
                >
                  Next lesson →
                </button>
              </div>
              </Panel>
            </div>
          )}

          <div id="course-quizzes" className="scroll-mt-6">
          <Panel className="p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-cyan-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Course quizzes</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Finish every lesson before starting a course quiz. Pass the final quiz with 70% or higher to earn one certificate for this course.
                </p>
              </div>
            </div>
            {!data.progress.lessonsComplete ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                Complete all {data.progress.totalLessons} lessons to unlock the quizzes.
              </p>
            ) : data.certificate ? (
              <Link to="/student/certificates" className="action-button inline-flex items-center gap-2">
                <Trophy className="h-4 w-4" /> View course certificate
              </Link>
            ) : data.quizzes.length ? (
              <div className="grid gap-3">
                {data.quizzes.map((quiz, index) => (
                  <Link
                    key={quiz._id}
                    to={`/student/quizzes/${quiz._id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-blue-500/5"
                  >
                    <span>
                      <span className="block font-black text-slate-900 dark:text-white">{index + 1}. {quiz.Title}</span>
                      {quiz.Description && <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{quiz.Description}</span>}
                    </span>
                    <span className="flex items-center gap-3">
                      {quiz.latestScore !== null && <span className="text-sm font-bold text-slate-500">Last score: {quiz.latestScore}%</span>}
                      {quiz.isFinal && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">Final quiz</span>}
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No published quizzes yet" message="Your teacher will add the course assessment here." />
            )}
          </Panel>
          </div>

          <Panel className="p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Ask your course tutor</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ask for a lesson explanation or a course summary based on your learning material.</p>
              </div>
            </div>
            <CourseTutor courseId={courseId} />
          </Panel>
        </div>
      )}
    </DashboardLayout>
  );
}

function CourseTutor({ courseId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitQuestion = async (question) => {
    if (!question.trim() || loading) return;
    const history = messages.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
    }));
    setMessages((current) => [...current, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const result = await askCourseTutor(courseId, question, history);
      setMessages((current) => [...current, { role: "assistant", content: result.reply }]);
    } catch (err) {
      console.error("Course tutor request failed:", err);
      setError(err.response?.data?.message || "The course tutor could not answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {messages.length > 0 && (
        <div className="mb-4 grid max-h-96 gap-3 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`max-w-[90%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "ml-auto bg-blue-500 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}>
              {message.content}
            </div>
          ))}
        </div>
      )}
      {error && <p role="alert" className="mb-3 text-sm font-bold text-amber-700 dark:text-amber-300">{error}</p>}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submitQuestion("Summarize this course and give me the key ideas to remember.")}
          disabled={loading}
          className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700 hover:bg-cyan-100 disabled:opacity-50 dark:bg-cyan-400/10 dark:text-cyan-300"
        >
          Summarize this course
        </button>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); submitQuestion(input); }} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={2000}
          placeholder="Ask a question about this course..."
          className="form-input min-w-0 flex-1"
        />
        <button type="submit" disabled={loading || !input.trim()} className="action-button inline-flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Ask
        </button>
      </form>
    </div>
  );
}

export default CourseLearning;
