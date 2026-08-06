import DashboardLayout from "../../layouts/DashboardLayout";
import Panel from "../../components/Panel";

function Docs() {
  return (
    <DashboardLayout title="Documents">
      <Panel className="p-8">
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Documents</h2>
        <p className="mt-2 text-lg font-semibold text-slate-600 dark:text-slate-300">File management coming soon.</p>
      </Panel>
    </DashboardLayout>
  );
}

export default Docs;
