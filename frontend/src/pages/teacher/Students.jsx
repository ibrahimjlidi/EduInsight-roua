import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import Panel from "../../components/Panel";
import SearchInput from "../../components/SearchInput";
import { getMyInscriptions } from "../../api/inscriptionApi";

function TeacherStudents() {
  const [inscriptions, setInscriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 8;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        setInscriptions(await getMyInscriptions());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const rows = useMemo(() => {
    const byStudent = new Map();
    inscriptions.forEach((item) => {
      const student = item.student;
      if (!student?._id) return;
      if (student.isActive === false) return;
      const current = byStudent.get(student._id) || {
        ...student,
        enrolled: 0,
        courses: [],
      };
      current.enrolled += 1;
      current.courses.push(item.course?.Title);
      byStudent.set(student._id, current);
    });

    return Array.from(byStudent.values()).filter((student) =>
      `${student.firstName} ${student.lastName} ${student.email}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [inscriptions, search]);

  const paginatedRows = useMemo(() => rows.slice((page - 1) * limit, page * limit), [rows, page]);
  const pagination = {
    page,
    pages: Math.max(Math.ceil(rows.length / limit), 1),
    total: rows.length,
    limit,
  };

  return (
    <DashboardLayout title="Students" subtitle="Learner management">
      <div className="mb-6">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search students..." />
      </div>
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Chargement...</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No students yet" message="Students enrolled in your courses will appear here." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-7 py-5 text-left font-black">Student</th>
                  <th className="px-7 py-5 text-left font-black">Email</th>
                  <th className="px-7 py-5 text-left font-black">Enrolled</th>
                  <th className="px-7 py-5 text-left font-black">Courses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedRows.map((student) => (
                  <tr key={student._id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/60">
                    <td className="px-7 py-4 font-black text-slate-950 dark:text-white">{student.firstName} {student.lastName}</td>
                    <td className="px-7 py-4 text-slate-600 dark:text-slate-300">{student.email}</td>
                    <td className="px-7 py-4 text-slate-700 dark:text-slate-200">{student.enrolled}</td>
                    <td className="px-7 py-4 text-slate-600 dark:text-slate-300">{student.courses.filter(Boolean).join(", ") || "—"}</td>
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

export default TeacherStudents;
