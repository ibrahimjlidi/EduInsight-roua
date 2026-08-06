import { Inbox } from "lucide-react";

function EmptyState({ title = "No data", message = "Nothing to show yet." }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center text-slate-500 dark:text-slate-400">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-500/10">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="font-bold text-slate-800 dark:text-white">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

export default EmptyState;
