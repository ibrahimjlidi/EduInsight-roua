import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Panel from "../../components/Panel";
import SearchInput from "../../components/SearchInput";
import { createUser, deactivateUser, getUsers, updateUser } from "../../api/userApi";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "student",
  isActive: true,
  speciality: "",
  office: "",
  studentCode: "",
  level: "L1",
  group: "",
};

const sanitizePayload = (formData, editing) => {
  const payload = Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  );

  if (!payload.password) delete payload.password;
  const selectedRole = payload.role;
  if (editing) delete payload.role;

  if (selectedRole !== "teacher") {
    delete payload.speciality;
    delete payload.office;
  }

  if (selectedRole !== "student") {
    delete payload.studentCode;
    delete payload.level;
    delete payload.group;
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") delete payload[key];
  });

  return payload;
};

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 5 });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers({
        page,
        limit: 5,
        search,
        ...(statusFilter === "all" ? { includeInactive: true } : {}),
        ...(statusFilter === "inactive" ? { includeInactive: true, isActive: false } : {}),
      });
      setUsers(data.users || data);
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
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "student",
      isActive: user.isActive !== false,
      speciality: user.speciality || "",
      office: user.office || "",
      studentCode: user.studentCode || "",
      level: user.level || "L1",
      group: user.group || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = sanitizePayload(form, Boolean(editing));
      if (editing) {
        await updateUser(editing._id || editing.id, payload);
      } else {
        await createUser(payload);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "User save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await deactivateUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "User update failed");
    }
  };

  return (
    <DashboardLayout title="User Management" subtitle="Manage platform users">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search users..." />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-2xl bg-white p-1 shadow-sm dark:bg-slate-950">
            {["active", "inactive", "all"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { setStatusFilter(item); setPage(1); }}
                className={`rounded-xl px-4 py-2 text-sm font-black capitalize transition ${
                  statusFilter === item
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="action-button inline-flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Chargement...</p>
        ) : users.length === 0 ? (
          <EmptyState title="No users" message="No matching users found." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-7 py-5 text-left font-black">Name</th>
                  <th className="px-7 py-5 text-left font-black">Email</th>
                  <th className="px-7 py-5 text-left font-black">Role</th>
                  <th className="px-7 py-5 text-left font-black">Status</th>
                  <th className="px-7 py-5 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr key={user._id || user.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/60">
                    <td className="px-7 py-4 font-black text-slate-950 dark:text-white">{user.firstName} {user.lastName}</td>
                    <td className="px-7 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                    <td className="px-7 py-4"><Badge tone={user.role}>{user.role}</Badge></td>
                    <td className="px-7 py-4"><Badge tone={user.isActive === false ? "inactive" : "active"}>{user.isActive === false ? "Inactive" : "Active"}</Badge></td>
                    <td className="px-7 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(user)} className="icon-action bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeactivate(user._id || user.id)} className="icon-action bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300">
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

      <Modal open={modalOpen} title={editing ? "Edit User" : "Add User"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="form-input" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input className="form-input" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <input className="form-input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="form-input" type="tel" placeholder="Phone optional" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="grid gap-4 md:grid-cols-2">
            <input className="form-input" type="password" placeholder={editing ? "New password optional" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
            <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={Boolean(editing)}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          {form.role === "teacher" && (
            <div className="grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10 md:grid-cols-2">
              <input className="form-input" placeholder="Speciality" value={form.speciality} onChange={(e) => setForm({ ...form, speciality: e.target.value })} />
              <input className="form-input" placeholder="Office" value={form.office} onChange={(e) => setForm({ ...form, office: e.target.value })} />
            </div>
          )}
          {form.role === "student" && (
            <div className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10 md:grid-cols-3">
              <input className="form-input" placeholder="Student code optional" value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
              <select className="form-input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
              </select>
              <input className="form-input" placeholder="Group" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
            </div>
          )}
          <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active account
          </label>
          <button disabled={saving} className="action-button disabled:opacity-60">
            {saving ? "Saving..." : "Save User"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Users;
