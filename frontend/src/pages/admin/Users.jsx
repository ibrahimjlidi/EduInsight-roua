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
  password: "",
  role: "student",
  isActive: true,
};

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
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
      const data = await getUsers({ page, limit: 5, search });
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
  }, [page, search]);

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
      password: "",
      role: user.role || "student",
      isActive: user.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
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
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500">
          <Plus className="h-4 w-4" />
          Add User
        </button>
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
                        <button onClick={() => openEdit(user)} className="rounded-full bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeactivate(user._id || user.id)} className="rounded-full bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300">
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
          <div className="grid gap-4 md:grid-cols-2">
            <input className="form-input" type="password" placeholder={editing ? "New password optional" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
            <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={Boolean(editing)}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active account
          </label>
          <button disabled={saving} className="rounded-full bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-500 disabled:opacity-60">
            {saving ? "Saving..." : "Save User"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Users;
