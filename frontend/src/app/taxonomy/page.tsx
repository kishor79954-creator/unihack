import Link from "next/link";
import { LayoutGrid, ArrowLeft } from "lucide-react";

export default function Taxonomy() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-300 flex-col gap-4">
      <LayoutGrid size={48} className="text-blue-500" />
      <h1 className="text-2xl font-bold text-white">Taxonomy Manager</h1>
      <p className="text-slate-500">This feature is slated for Phase 5.</p>
      <Link href="/" className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
    </div>
  );
}
