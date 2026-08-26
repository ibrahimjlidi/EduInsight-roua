import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Panel from "../../components/Panel";
import SearchInput from "../../components/SearchInput";
import { getCourses } from "../../api/courseApi";
import { createDocument, deleteDocument, getDocuments, getDocumentUrl, updateDocument } from "../../api/documentApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  title: "",
  description: "",
  course: "",
  audience: "all",
  file: null,
};

const formatSize = (size = 0) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function Docs() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const canUpload = user?.role === "admin" || user?.role === "teacher";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docData, courseData] = await Promise.all([
        getDocuments({ page, limit: 5, search }),
        canUpload ? getCourses() : Promise.resolve([]),
      ]);
      setDocuments(docData.documents || docData);
      setCourses(courseData.courses || courseData);
      setPagination({
        page: docData.page || 1,
        pages: docData.pages || 1,
        total: docData.total || (Array.isArray(docData) ? docData.length : 0),
        limit: docData.limit || 5,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [canUpload, page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const visibleCourses = useMemo(() => {
    if (user?.role !== "teacher") return courses;
    const userId = user?._id || user?.id;
    return courses.filter((course) => String(course.Teacher?._id || course.Teacher) === String(userId));
  }, [courses, user]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setEditing(doc);
    setForm({
      title: doc.title || "",
      description: doc.description || "",
      course: doc.course?._id || doc.course || "",
      audience: doc.audience || "all",
      file: null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editing && !form.file) {
      alert("Choose a file first.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateDocument(editing._id, {
          title: form.title,
          description: form.description,
          audience: form.audience,
          course: form.course,
        });
      } else {
        const payload = new FormData();
        payload.append("title", form.title);
        payload.append("description", form.description);
        payload.append("audience", form.audience);
        if (form.course) payload.append("course", form.course);
        payload.append("file", form.file);
        await createDocument(payload);
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Document upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await deleteDocument(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Document delete failed");
    }
  };

  return (
    <DashboardLayout title="Documents" subtitle="Learning library">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search documents..." />
        {canUpload && (
          <button onClick={openCreate} className="action-button inline-flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Upload document
          </button>
        )}
      </div>

      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Chargement...</p>
        ) : documents.length === 0 ? (
          <EmptyState title="No documents" message="Uploaded documents from MongoDB will appear here." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-7 py-5 text-left font-black">Document</th>
                  <th className="px-7 py-5 text-left font-black">Course</th>
                  <th className="px-7 py-5 text-left font-black">Audience</th>
                  <th className="px-7 py-5 text-left font-black">Size</th>
                  <th className="px-7 py-5 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => (
                  <tr key={doc._id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/60">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-950 dark:text-white">{doc.title}</p>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{doc.originalName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{doc.course?.Title || "General"}</td>
                    <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{doc.audience}</td>
                    <td className="px-7 py-4 text-slate-700 dark:text-slate-300">{formatSize(doc.size)}</td>
                    <td className="px-7 py-4">
                      <div className="flex justify-end gap-2">
                        <a href={getDocumentUrl(doc.fileName)} target="_blank" rel="noreferrer" className="icon-action bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">
                          <Download className="h-4 w-4" />
                        </a>
                        {canUpload && (
                          <>
                            <button onClick={() => openEdit(doc)} className="icon-action bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(doc._id)} className="icon-action bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
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

      <Modal open={modalOpen} title={editing ? "Edit document" : "Upload document"} onClose={() => { setModalOpen(false); setEditing(null); }}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input className="form-input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="form-input min-h-24" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <select className="form-input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
              <option value="">General document</option>
              {visibleCourses.map((course) => (
                <option key={course._id} value={course._id}>{course.Title}</option>
              ))}
            </select>
            <select className="form-input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">All roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              {user?.role === "admin" && <option value="admin">Admins</option>}
            </select>
          </div>
          {!editing && (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-6 text-center font-bold text-blue-600 transition hover:-translate-y-0.5 hover:border-blue-400 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300">
              <UploadCloud className="mb-2 h-8 w-8" />
              {form.file ? form.file.name : "Choose PDF, Office, text, or image file"}
              <input className="hidden" type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
            </label>
          )}
          <button disabled={saving} className="action-button disabled:opacity-60">{saving ? "Saving..." : "Save document"}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Docs;
