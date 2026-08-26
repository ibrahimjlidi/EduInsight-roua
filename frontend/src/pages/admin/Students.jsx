import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import Panel from "../../components/Panel";
import SearchInput from "../../components/SearchInput";
import { getUsers } from "../../api/userApi";
import { getMyInscriptions } from "../../api/inscriptionApi";

function Students() {
  const [users, setUsers] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 8 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, inscriptionsData] = await Promise.all([
        getUsers({ page, limit: 8, search, role: "student" }),
        getMyInscriptions(),
      ]);
      setUsers(usersData.users || []);
      setPagination({
        page: usersData.page || 1,
        pages: usersData.pages || 1,
        total: usersData.total || 0,
        limit: usersData.limit || 8,
      });
      setInscriptions(inscriptionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = useMemo(() => {
    return users
      .map((student) => {
        const enrolled = inscriptions.filter((item) => String(item.student?._id || item.student) === String(student._id)).length;
        return { ...student, enrolled };
      })
  }, [users, inscriptions]);

  return (
    <DashboardLayout title="Students" subtitle="Learner management">
      <div className="mb-6">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search students..." />
      </div>
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Chargement...</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No students" message="Student accounts will appear here." />
        ) : (
          <>
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
            <Pagination {...pagination} onPageChange={setPage} />
          </>
        )}
      </Panel>
    </DashboardLayout>
  );
}

export default Students;
