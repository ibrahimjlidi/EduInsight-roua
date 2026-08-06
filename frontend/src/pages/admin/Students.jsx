import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Panel from "../../components/Panel";
import SearchInput from "../../components/SearchInput";
import { getUsers } from "../../api/userApi";
import { getMyInscriptions } from "../../api/inscriptionApi";

function Students() {
  const [users, setUsers] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, inscriptionsData] = await Promise.all([getUsers(), getMyInscriptions()]);
        setUsers(usersData.filter((user) => user.role === "student"));
        setInscriptions(inscriptionsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const rows = useMemo(() => {
    return users
      .map((student) => {
        const enrolled = inscriptions.filter((item) => String(item.student?._id || item.student) === String(student._id)).length;
        return { ...student, enrolled };
      })
      .filter((student) => `${student.firstName} ${student.lastName} ${student.email}`.toLowerCase().includes(search.toLowerCase()));
  }, [users, inscriptions, search]);

  return (
    <DashboardLayout title="Students" subtitle="Learner management">
      <div className="mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search students..." />
      </div>
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Chargement...</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No students" message="Student accounts will appear here." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-7 py-5 text-left font-black">Student</th>
                <th className="px-7 py-5 text-left font-black">Email</th>
                <th className="px-7 py-5 text-left font-black">Enrolled</th>
                <th className="px-7 py-5 text-left font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((student) => (
                <tr key={student._id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/60">
                  <td className="px-7 py-4 font-black text-slate-950 dark:text-white">{student.firstName} {student.lastName}</td>
                  <td className="px-7 py-4 text-slate-600 dark:text-slate-300">{student.email}</td>
                  <td className="px-7 py-4 text-slate-700 dark:text-slate-200">{student.enrolled}</td>
                  <td className="px-7 py-4"><Badge tone={student.isActive === false ? "inactive" : "active"}>{student.isActive === false ? "Inactive" : "Active"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </DashboardLayout>
  );
}

export default Students;
