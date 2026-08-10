import { useEffect, useMemo, useState } from "react";
import { Award, Download } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import { getMyInscriptions } from "../../api/inscriptionApi";
import { useAuth } from "../../context/AuthContext";

function Certificates() {
  const { user } = useAuth();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <DashboardLayout title="Certificates" subtitle="Your achievements">
      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : certificates.length === 0 ? (
        <EmptyState title="No certificates yet" message="Completed courses will generate certificates here." />
      ) : (
        <div className="grid gap-6">
          {certificates.map((item) => (
            <section key={item._id} className="flex min-h-[330px] flex-col items-center justify-center rounded-[1.35rem] border-4 border-double border-amber-400 bg-amber-50/70 p-8 text-center text-amber-950 shadow-sm dark:bg-amber-500/10 dark:text-amber-100">
              <Award className="mb-6 h-16 w-16 text-amber-500" />
              <h2 className="text-4xl font-black">Certificate of Completion</h2>
              <p className="mt-3 text-lg font-semibold">This certifies that</p>
              <p className="text-2xl font-black">{user?.firstName} {user?.lastName}</p>
              <p className="mt-3 text-lg font-semibold">has successfully completed</p>
              <p className="text-2xl font-black">{item.course?.Title}</p>
              <button className="action-button mt-5 inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </button>
            </section>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default Certificates;
