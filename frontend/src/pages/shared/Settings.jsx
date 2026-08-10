import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Panel from "../../components/Panel";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { updateAvatar, updateUser } from "../../api/userApi";

const uploadsBase = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");

function Settings() {
  const { user, setUser } = useAuth();
  const { toggleTheme } = useTheme();
  const userId = user?.id || user?._id;
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const avatarUrl = avatarPreview || (user?.avatar ? `${uploadsBase}/uploads/avatars/${user.avatar}` : "");

  const handleSave = async (event) => {
    event.preventDefault();
    if (!userId) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateUser(userId, form);
      const nextUser = {
        ...user,
        ...form,
        avatar: updated.avatar ?? user?.avatar,
      };
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
      setMessage("Profile saved successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    setAvatarFile(file || null);
    setAvatarPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !userId) return;
    setUploading(true);
    setMessage("");
    try {
      const updated = await updateAvatar(userId, avatarFile);
      const nextUser = { ...user, avatar: updated.avatar };
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
      setAvatarFile(null);
      setAvatarPreview("");
      setMessage("Avatar uploaded successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Avatar upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="grid gap-6">
        <Panel className="p-8">
          <h2 className="mb-4 text-2xl font-black text-slate-950 dark:text-white">Profile</h2>
          <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-slate-50 p-5 dark:bg-slate-900 md:flex-row md:items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-9 w-9" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-black text-slate-950 dark:text-white">Profile image</p>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">PNG, JPG or GIF. Max 2MB, saved in backend uploads/avatars.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input className="form-input" type="file" accept="image/*" onChange={handleAvatarChange} />
                <button
                  type="button"
                  disabled={!avatarFile || uploading}
                  onClick={handleAvatarUpload}
                  className="action-button inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
              <input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
            </div>
            <input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
            {message && <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{message}</p>}
            <button disabled={saving} className="action-button w-fit disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </Panel>

        <Panel className="p-8">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Theme</h2>
          <button onClick={toggleTheme} className="mt-4 rounded-full bg-blue-50 px-5 py-3 font-black text-blue-600 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">
            Toggle Dark Mode
          </button>
        </Panel>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
