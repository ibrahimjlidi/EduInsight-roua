import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Panel from "../../components/Panel";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function Settings() {
  const { user, setUser } = useAuth();
  const { toggleTheme } = useTheme();
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const handleSave = (event) => {
    event.preventDefault();
    const nextUser = { ...user, ...form };
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  return (
    <DashboardLayout title="Settings">
      <div className="grid gap-6">
        <Panel className="p-8">
          <h2 className="mb-4 text-2xl font-black text-slate-950 dark:text-white">Profile</h2>
          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
              <input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
            </div>
            <input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
            <button className="w-fit rounded-full bg-blue-600 px-6 py-3 font-black text-white transition hover:bg-blue-500">Save</button>
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
