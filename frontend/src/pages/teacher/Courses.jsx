// src/pages/teacher/Courses.jsx

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import SearchInput from "../../components/SearchInput";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Panel from "../../components/Panel";
import { getCourses, createCourse, updateCourse, deleteCourse } from "../../api/courseApi";
import { getDepartments } from "../../api/departmentApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  Title: "",
  Description: "",
  Department: "",
  Duration: "",
  Level: "Beginner",
};

const uploadsBase = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");

function TeacherCourses() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 5 });

  const fetchCourses = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const teacherId = user._id || user.id;
      const [data, departmentsData] = await Promise.all([
        getCourses({ page, limit: 5, search, teacher: teacherId }),
        getDepartments(),
      ]);
      setDepartments(departmentsData);
      setCourses(data.courses || data);
      setPagination({
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || (Array.isArray(data) ? data.length : 0),
        limit: data.limit || 5,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce cours ?")) return;

    try {
      await deleteCourse(id);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    setForm({ ...emptyForm, Department: departments[0]?._id || "" });
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setImageFile(null);
    setForm({
      Title: course.Title || "",
      Description: course.Description || "",
      Department: course.Department?._id || course.Department || "",
      Duration: course.Duration || "",
      Level: course.Level || "Beginner",
    });
    setModalOpen(true);
  };

  const buildCoursePayload = () => {
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
    if (imageFile) {
      payload.append("Image", imageFile);
    }
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = buildCoursePayload();
      if (editing) {
        await updateCourse(editing._id, payload);
      } else {
        await createCourse(payload);
      }
      setModalOpen(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Course save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Courses" subtitle="Manage courses">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          My Courses
        </h2>

        <button
          onClick={openCreate}
          className="action-button inline-flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Course
        </button>
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search my courses..."
        />
      </div>

      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500 dark:text-slate-400">
            Chargement...
          </p>
        ) : courses.length === 0 ? (
          <EmptyState title="Aucun cours" message="Ajoute ton premier cours pour le voir ici." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left px-7 py-5 font-black">
                    Course
                  </th>

                  <th className="text-left px-7 py-5 font-black">
                    Level
                  </th>

                  <th className="text-left px-7 py-5 font-black">
                    Duration
                  </th>

                  <th className="text-right px-7 py-5 font-black">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {courses.map((course) => (
                  <tr
                    key={course._id}
                    className="text-slate-700 transition hover:bg-blue-50/40 dark:text-slate-300 dark:hover:bg-slate-900/60"
                  >
                    <td className="px-7 py-4 font-black text-slate-950 dark:text-white">
                      <div className="flex items-center gap-3">
                        {course.Image && <img src={`${uploadsBase}/uploads/courses/${course.Image}`} alt="" className="h-10 w-10 rounded-xl object-cover" />}
                        <span>{course.Title}</span>
                      </div>
                    </td>

                    <td className="px-7 py-4">
                      <Badge tone="active">{course.Level || "Active"}</Badge>
                    </td>

                    <td className="px-7 py-4">
                      {course.Duration || "—"}
                    </td>

                    <td className="px-7 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(course)}
                          className="icon-action bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(course._id)}
                          className="icon-action bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <Modal open={modalOpen} title={editing ? "Edit Course" : "New Course"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input className="form-input" placeholder="Course title" value={form.Title} onChange={(e) => setForm({ ...form, Title: e.target.value })} required />
          <textarea className="form-input min-h-28" placeholder="Description" value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} required />
          <div className="grid gap-4 md:grid-cols-2">
            <select className="form-input" value={form.Department} onChange={(e) => setForm({ ...form, Department: e.target.value })} required>
              <option value="">Choose department</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>{department.name}</option>
              ))}
            </select>
            <input className="form-input" placeholder="Duration" value={form.Duration} onChange={(e) => setForm({ ...form, Duration: e.target.value })} />
          </div>
          <select className="form-input" value={form.Level} onChange={(e) => setForm({ ...form, Level: e.target.value })}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Upcoming</option>
          </select>
          <input className="form-input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          <button disabled={saving} className="action-button mt-2 disabled:opacity-60">
            {saving ? "Saving..." : "Save Course"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default TeacherCourses;
