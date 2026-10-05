import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, FileText, Loader2, Pencil, Plus, Save, Trash2, Video } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Panel from "../../components/Panel";
import { getCourses } from "../../api/courseApi";
import {
  createCourseLesson,
  createCourseModule,
  deleteCourseLesson,
  deleteCourseModule,
  getCourseContent,
  updateCourseLesson,
  updateCourseModule,
} from "../../api/courseContentApi";

const emptyModule = { Title: "", Description: "", Order: 1 };
const emptyLesson = { Title: "", Content: "", VideoUrl: "", PdfUrl: "", Order: 1 };

function CourseContentManagement() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editingModule, setEditingModule] = useState("");
  const [lessonEditor, setLessonEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseData, contentData] = await Promise.all([
        getCourses(),
        getCourseContent(courseId),
      ]);
      const courseList = courseData.courses || courseData;
      setCourse(courseList.find((item) => String(item._id) === String(courseId)) || null);
      setModules(contentData);
    } catch (err) {
      console.error("Failed to load course authoring data:", err);
      setError(err.response?.data?.message || "Could not load this course's content.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const saveModule = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingModule) {
        await updateCourseModule(courseId, editingModule, moduleForm);
      } else {
        await createCourseModule(courseId, { ...moduleForm, Order: Number(moduleForm.Order) });
      }
      setModuleForm(emptyModule);
      setEditingModule("");
      await loadContent();
    } catch (err) {
      console.error("Failed to save course module:", err);
      setError(err.response?.data?.message || "Could not save the module.");
    } finally {
      setSaving(false);
    }
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    if (!lessonEditor) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...lessonForm, Order: Number(lessonForm.Order) };
      if (lessonEditor.lessonId) {
        await updateCourseLesson(courseId, lessonEditor.moduleId, lessonEditor.lessonId, payload);
      } else {
        await createCourseLesson(courseId, lessonEditor.moduleId, payload);
      }
      setLessonForm(emptyLesson);
      setLessonEditor(null);
      await loadContent();
    } catch (err) {
      console.error("Failed to save course lesson:", err);
      setError(err.response?.data?.message || "Could not save the lesson.");
    } finally {
      setSaving(false);
    }
  };

  const removeModule = async (module) => {
    if (!window.confirm(`Delete "${module.Title}" and all its lessons?`)) return;
    try {
      await deleteCourseModule(courseId, module._id);
      await loadContent();
    } catch (err) {
      console.error("Failed to delete course module:", err);
      setError(err.response?.data?.message || "Could not delete the module.");
    }
  };

  const removeLesson = async (moduleId, lesson) => {
    if (!window.confirm(`Delete lesson "${lesson.Title}"?`)) return;
    try {
      await deleteCourseLesson(courseId, moduleId, lesson._id);
      await loadContent();
    } catch (err) {
      console.error("Failed to delete course lesson:", err);
      setError(err.response?.data?.message || "Could not delete the lesson.");
    }
  };

  const startLessonEdit = (module, lesson) => {
    setLessonEditor({ moduleId: module._id, lessonId: lesson._id });
    setLessonForm({
      Title: lesson.Title || "",
      Content: lesson.Content || "",
      VideoUrl: lesson.VideoUrl || "",
      PdfUrl: lesson.PdfUrl || "",
      Order: lesson.Order || 1,
    });
  };

  return (
    <DashboardLayout title="Course content" subtitle={course?.Title || "Build course modules and lessons"}>
      <Link
        to={course?.Teacher?.role === "teacher" ? "/teacher/courses" : "/admin/courses"}
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to courses
      </Link>
      <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Add structured lessons, explanations and optional YouTube or PDF links. Students see this content in their course player; lesson changes are saved to MongoDB.
      </p>
      {error && <p role="alert" className="mb-5 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
      {loading ? (
        <Panel className="flex items-center gap-3 p-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading course content...</Panel>
      ) : !course ? (
        <EmptyState title="Course not found" message={error || "This course may have been deleted."} />
      ) : (
        <div className="grid gap-6">
          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Plus className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-black text-slate-950 dark:text-white">{editingModule ? "Edit module" : "Add a module"}</h2>
            </div>
            <form onSubmit={saveModule} className="grid gap-3 md:grid-cols-2">
              <input className="form-input" placeholder="Module title" value={moduleForm.Title} onChange={(event) => setModuleForm({ ...moduleForm, Title: event.target.value })} required />
              <input className="form-input" type="number" min="1" placeholder="Order" value={moduleForm.Order} onChange={(event) => setModuleForm({ ...moduleForm, Order: event.target.value })} required />
              <textarea className="form-input min-h-20 md:col-span-2" placeholder="What will students learn in this module?" value={moduleForm.Description} onChange={(event) => setModuleForm({ ...moduleForm, Description: event.target.value })} />
              <div className="flex gap-2 md:col-span-2">
                <button disabled={saving} className="action-button inline-flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingModule ? "Save module" : "Add module"}
                </button>
                {editingModule && <button type="button" onClick={() => { setEditingModule(""); setModuleForm(emptyModule); }} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold dark:bg-slate-800">Cancel</button>}
              </div>
            </form>
          </Panel>

          {modules.length === 0 ? (
            <Panel className="p-6"><EmptyState title="No modules yet" message="Start by adding the first module above." /></Panel>
          ) : modules.map((module) => (
            <Panel key={module._id} className="p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-1 h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-blue-500">Module {module.Order}</p>
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">{module.Title}</h2>
                    {module.Description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{module.Description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" aria-label={`Edit ${module.Title}`} onClick={() => { setEditingModule(module._id); setModuleForm({ Title: module.Title, Description: module.Description || "", Order: module.Order || 1 }); }} className="icon-action bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Pencil className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Delete ${module.Title}`} onClick={() => removeModule(module)} className="icon-action bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="grid gap-3">
                {(module.lessons || []).map((lesson) => (
                  <article key={lesson._id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Lesson {lesson.Order}</p>
                      <h3 className="font-black text-slate-900 dark:text-white">{lesson.Title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{lesson.Content}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                        {lesson.VideoUrl && <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video linked</span>}
                        {lesson.PdfUrl && <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> PDF linked</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" aria-label={`Edit lesson ${lesson.Title}`} onClick={() => startLessonEdit(module, lesson)} className="icon-action bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Pencil className="h-4 w-4" /></button>
                      <button type="button" aria-label={`Delete lesson ${lesson.Title}`} onClick={() => removeLesson(module._id, lesson)} className="icon-action bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </article>
                ))}
                {lessonEditor?.moduleId === module._id && (
                  <form onSubmit={saveLesson} className="grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900 md:grid-cols-2">
                    <h3 className="font-black md:col-span-2">{lessonEditor.lessonId ? "Edit lesson" : `Add lesson to ${module.Title}`}</h3>
                    <input className="form-input" placeholder="Lesson title" value={lessonForm.Title} onChange={(event) => setLessonForm({ ...lessonForm, Title: event.target.value })} required />
                    <input className="form-input" type="number" min="1" placeholder="Order" value={lessonForm.Order} onChange={(event) => setLessonForm({ ...lessonForm, Order: event.target.value })} required />
                    <textarea className="form-input min-h-36 md:col-span-2" placeholder="Lesson content: explain the concept, show examples, and give students something to practise." value={lessonForm.Content} onChange={(event) => setLessonForm({ ...lessonForm, Content: event.target.value })} required />
                    <input className="form-input" type="url" placeholder="Optional YouTube video URL" value={lessonForm.VideoUrl} onChange={(event) => setLessonForm({ ...lessonForm, VideoUrl: event.target.value })} />
                    <input className="form-input" type="url" placeholder="Optional PDF resource URL" value={lessonForm.PdfUrl} onChange={(event) => setLessonForm({ ...lessonForm, PdfUrl: event.target.value })} />
                    <div className="flex gap-2 md:col-span-2">
                      <button disabled={saving} className="action-button inline-flex items-center gap-2 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save lesson"}</button>
                      <button type="button" onClick={() => { setLessonEditor(null); setLessonForm(emptyLesson); }} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">Cancel</button>
                    </div>
                  </form>
                )}
                {!lessonEditor && (
                  <button type="button" onClick={() => { setLessonEditor({ moduleId: module._id }); setLessonForm({ ...emptyLesson, Order: (module.lessons?.length || 0) + 1 }); }} className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <Plus className="h-4 w-4" /> Add lesson
                  </button>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default CourseContentManagement;
