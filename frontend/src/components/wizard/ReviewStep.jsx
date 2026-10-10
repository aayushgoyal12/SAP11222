import { useMemo, useState } from "react";
import { ArrowRight, Search, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS, cmpLabel } from "@/lib/status";
import { KpiCards } from "./KpiCards";
import { ResultsTable } from "./ResultsTable";
import { RowDetail } from "./RowDetail";

const matches = (r, f) => f === "ALL" || (f === "EXCEPTIONS" ? r.status !== "MATCHED" : r.status === f);

export const ReviewStep = ({ job, results, onUpdate, onNext }) => {
  const cmp = cmpLabel(job.comparison_type);
  const [filter, setFilter] = useState("EXCEPTIONS");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const counts = useMemo(() => results.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {}), [results]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return results.filter((r) => matches(r, filter) && (!t ||
      [r.gstin, r.vendor_name, r.sap_invoice_no, r.cmp_invoice_no, r.reason].join(" ").toLowerCase().includes(t)));
  }, [results, filter, q]);
  const pills = [["EXCEPTIONS", "Exceptions", job.summary.requires_review], ["ALL", "All", results.length],
    ...Object.keys(STATUS).map((k) => [k, STATUS[k].label(cmp), counts[k] || 0])];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Review exceptions</h2>
          <p className="mt-1 font-data text-xs text-slate-500">{job.name} · tolerance ₹{job.settings.tolerance} · {job.summary.processing_ms} ms</p>
        </div>
        <Button data-testid="go-export-btn" onClick={onNext} className="bg-blue-600 text-white hover:bg-blue-500 active:scale-95">
          Export Excel reports <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <KpiCards summary={job.summary} cmp={cmp} filter={filter} setFilter={setFilter} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div data-testid="status-filter" className="flex flex-wrap gap-1.5">
          {pills.map(([k, l, n]) => (
            <button key={k} data-testid={`filter-${k.toLowerCase()}`} onClick={() => setFilter(k)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${filter === k ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
              {l} <span className="font-data text-slate-500">{n}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input data-testid="review-table-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search GSTIN, vendor, invoice, reason" className="border-slate-300 bg-white pl-8 text-sm" />
        </div>
      </div>
      <ResultsTable rows={rows} cmp={cmp} onSelect={setSel} />
      <details data-testid="assumptions-panel" className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 text-sm" open>
        <summary className="flex cursor-pointer items-center gap-2 font-semibold text-slate-700"><ListChecks className="h-4 w-4 text-sky-600" />Assumptions applied in this run</summary>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-600">{job.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
      </details>
      <RowDetail row={sel} jobId={job.id} cmp={cmp} onClose={() => setSel(null)} onUpdate={onUpdate} />
    </section>
  );
};
