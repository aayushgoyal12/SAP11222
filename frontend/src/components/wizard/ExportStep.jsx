import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, FileWarning, FileSpreadsheet, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMsg, reportUrl } from "@/lib/api";
import { cmpLabel, fmtDate } from "@/lib/status";

const ReportCard = ({ href, icon: Icon, title, desc, testId, primary }) => (
  <a href={href} data-testid={testId}
    className={`group flex flex-col justify-between gap-6 rounded-lg border p-6 transition-colors duration-200 ${primary ? "border-blue-600/60 bg-blue-600/10 hover:bg-blue-600/20" : "border-slate-800 bg-[#0F172A] hover:bg-[#1E293B]"}`}>
    <Icon className={`h-7 w-7 ${primary ? "text-blue-400" : "text-slate-400"}`} />
    <div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
    </div>
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 group-hover:text-white"><Download className="h-4 w-4" /> Download .xlsx</span>
  </a>
);

export const ExportStep = ({ job, results }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const cmp = cmpLabel(job.comparison_type);
  const reviewed = results.filter((r) => r.reviewed).length;

  const remove = async () => {
    if (!window.confirm("Delete this job, its uploaded file data and results now?")) return;
    setBusy(true);
    try { await api.delete(`/jobs/${job.id}`); toast.success("Job data deleted"); navigate("/"); }
    catch (e) { toast.error(errMsg(e)); setBusy(false); }
  };

  return (
    <section className="fade-up space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Export reports</h2>
        <p className="mt-1 text-sm text-slate-400">
          {job.summary.requires_review} exception(s) · {reviewed} reviewed · reviewer notes are included in both files.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ReportCard primary testId="export-exceptions-excel-btn" href={reportUrl(job.id, "exceptions")} icon={FileWarning}
          title="Exception-only report" desc={`Summary, assumptions, all exceptions, plus one sheet per type (Missing in ${cmp}, mismatches, duplicates, invalid, missing in SAP).`} />
        <ReportCard testId="export-full-excel-btn" href={reportUrl(job.id, "full")} icon={FileSpreadsheet}
          title="Full reconciliation report" desc="Everything in the exception report plus every matched record with source, comparison and difference columns." />
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 p-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span data-testid="retention-info" className="flex items-center gap-2"><Clock className="h-4 w-4" />Uploaded rows and results auto-delete on {fmtDate(job.expires_at)}.</span>
        <Button data-testid="delete-job-btn" variant="ghost" disabled={busy} onClick={remove} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
          <Trash2 className="h-4 w-4" /> Delete job data now
        </Button>
      </div>
    </section>
  );
};
