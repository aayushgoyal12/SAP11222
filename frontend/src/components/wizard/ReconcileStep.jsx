import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Play, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errMsg } from "@/lib/api";
import { cmpLabel } from "@/lib/status";

const DateSelect = ({ label, value, onChange, formats, testId }) => (
  <div>
    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testId} className="border-slate-700 bg-slate-950"><SelectValue /></SelectTrigger>
      <SelectContent>
        {Object.entries(formats).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

export const ReconcileStep = ({ job, schema, mapping, onBack, onDone }) => {
  const s = job.settings || {};
  const [tol, setTol] = useState(String(s.tolerance ?? 1));
  const [sapFmt, setSapFmt] = useState(s.sap_date_format || "AUTO");
  const [cmpFmt, setCmpFmt] = useState(s.cmp_date_format || "AUTO");
  const [busy, setBusy] = useState(false);
  const label = cmpLabel(job.comparison_type);
  const tolNum = Number(tol);
  const tolValid = tol !== "" && !Number.isNaN(tolNum) && tolNum >= 0;

  const run = async () => {
    setBusy(true);
    try {
      await api.post(`/jobs/${job.id}/reconcile`, {
        sap_mapping: mapping.sap, cmp_mapping: mapping.comparison, tolerance: tolNum,
        sap_date_format: sapFmt, cmp_date_format: cmpFmt,
      });
      toast.success("Reconciliation complete");
      await onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <section className="fade-up grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6 rounded-lg border border-slate-800 bg-[#0F172A] p-6">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-blue-400" />
          <h2 className="font-display text-2xl font-bold">Matching settings</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">Amount tolerance (₹, per field)</label>
          <div className="flex flex-wrap items-center gap-2">
            <Input data-testid="amount-tolerance-input" type="number" min="0" step="0.01" value={tol}
              onChange={(e) => setTol(e.target.value)} className="w-32 border-slate-700 bg-slate-950 font-data" />
            {[0, 1, 5, 10].map((v) => (
              <button key={v} data-testid={`tolerance-chip-${v}`} onClick={() => setTol(String(v))}
                className={`rounded border px-2.5 py-1 font-data text-xs transition-colors ${
                  tolNum === v ? "border-blue-500 bg-blue-600/20 text-blue-200" : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}>₹{v}</button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Differences up to this amount on taxable value or tax are treated as rounding and noted, not flagged.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateSelect label="SAP date format" value={sapFmt} onChange={setSapFmt} formats={schema.date_formats} testId="sap-date-format-select" />
          <DateSelect label={`${label} date format`} value={cmpFmt} onChange={setCmpFmt} formats={schema.date_formats} testId="cmp-date-format-select" />
        </div>
        <div className="flex justify-between border-t border-slate-800 pt-5">
          <Button data-testid="back-to-mapping-btn" variant="ghost" onClick={onBack} className="text-slate-400 hover:bg-slate-800 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Mapping
          </Button>
          <Button data-testid="run-reconciliation-btn" onClick={run} disabled={busy || !tolValid}
            className="bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run validation & matching
          </Button>
        </div>
      </div>
      <aside className="space-y-3 rounded-lg border border-slate-800 p-6 text-sm text-slate-400">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">What gets checked</h3>
        <ul className="space-y-2">
          <li><span className="text-slate-200">Validity</span> — 15-char GSTIN format, invoice no, parseable date, numeric amounts.</li>
          <li><span className="text-slate-200">Duplicates</span> — same GSTIN + invoice no within one file.</li>
          <li><span className="text-slate-200">Pairing</span> — GSTIN + invoice no (ignoring case, spaces, / - and leading zeros).</li>
          <li><span className="text-slate-200">Comparison</span> — taxable value and tax within tolerance, then invoice date.</li>
          <li><span className="text-slate-200">Gaps</span> — in SAP but not in {label}, and vice versa.</li>
        </ul>
        <p className="font-data text-xs text-slate-500">{job.sap.row_count} SAP rows · {job.comparison.row_count} {label} rows</p>
      </aside>
    </section>
  );
};
