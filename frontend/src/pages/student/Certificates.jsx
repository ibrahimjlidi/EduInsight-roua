import { useEffect, useMemo, useState } from "react";
import { Award, Download } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import { getMyInscriptions } from "../../api/inscriptionApi";
import { useAuth } from "../../context/AuthContext";

function Certificates() {
  const { user } = useAuth();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 2;

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

  const certificates = useMemo(() => inscriptions.filter((item) => item.status === "completed"), [inscriptions]);
  const paginatedCertificates = useMemo(
    () => certificates.slice((page - 1) * limit, page * limit),
    [certificates, page]
  );
  const pagination = {
    page,
    pages: Math.max(Math.ceil(certificates.length / limit), 1),
    total: certificates.length,
    limit,
  };

  const downloadCertificate = (item) => {
    const studentName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Student";
    const courseTitle = item.course?.Title || "Course";
    const issuedAt = new Date(item.updatedAt || item.enrolledAt || Date.now()).toLocaleDateString();
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Certificate - ${courseTitle}</title>
    <style>
      body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f8fafc; color: #451a03; }
      .certificate { min-height: 720px; margin: 40px; display: grid; place-items: center; border: 8px double #d4a72c; background: linear-gradient(135deg,#fff7ed,#fffbeb,#ffffff); text-align: center; }
      .badge { width: 82px; height: 82px; border-radius: 999px; margin: 0 auto; background: #d4a72c; color: white; display: grid; place-items: center; font-size: 44px; font-weight: 900; }
      h1 { font-size: 52px; margin: 12px 0; }
      h2 { font-size: 34px; margin: 10px 0; }
      p { font-size: 22px; margin: 8px 0; }
      .small { font-size: 16px; color: #92400e; }
    </style>
  </head>
  <body>
    <main class="certificate">
      <section>
        <div class="badge">EI</div>
        <h1>Certificate of Completion</h1>
        <p>This certifies that</p>
        <h2>${studentName}</h2>
        <p>has successfully completed</p>
        <h2>${courseTitle}</h2>
        <p class="small">Issued on ${issuedAt} · EduInsight</p>
      </section>
    </main>
  </body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `certificate-${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Certificates" subtitle="Your achievements">
      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : certificates.length === 0 ? (
        <EmptyState title="No certificates yet" message="Completed courses will generate certificates here." />
      ) : (
        <div className="grid gap-6">
          {paginatedCertificates.map((item) => (
            <section key={item._id} className="flex min-h-[330px] flex-col items-center justify-center rounded-[1.35rem] border-4 border-double border-amber-400 bg-amber-50/70 p-8 text-center text-amber-950 shadow-sm dark:bg-amber-500/10 dark:text-amber-100">
              <Award className="mb-6 h-16 w-16 text-amber-500" />
              <h2 className="text-4xl font-black">Certificate of Completion</h2>
              <p className="mt-3 text-lg font-semibold">This certifies that</p>
              <p className="text-2xl font-black">{user?.firstName} {user?.lastName}</p>
              <p className="mt-3 text-lg font-semibold">has successfully completed</p>
              <p className="text-2xl font-black">{item.course?.Title}</p>
              <button onClick={() => downloadCertificate(item)} className="action-button mt-5 inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </button>
            </section>
          ))}
          <Pagination {...pagination} onPageChange={setPage} />
        </div>
      )}
    </DashboardLayout>
  );
}

export default Certificates;
