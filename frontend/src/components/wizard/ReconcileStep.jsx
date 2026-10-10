import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Play, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errMsg } from "@/lib/api";
import { cmpLabel } from "@/lib/status";

const DateSelect = ({ label, value, onChange, formats, testId, detect }) => (
  <div>
    <label className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
      {label}
      {detect && detect !== "AUTO" && (
        <span data-testid={`${testId}-detected`} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-emerald-700">
          auto-detected {detect}
        </span>
      )}
    </label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testId} className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
      <SelectContent>
        {Object.entries(formats).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

export const ReconcileStep = ({ job, schema, mapping, onBack, onDone }) => {
  const s = job.settings || {};
  const [tol, setTol] = useState(String(s.tolerance ?? 1));
  const [sapFmt, setSapFmt] = useState(s.sap_date_format || job.sap.suggested_date_format || "AUTO");
  const [cmpFmt, setCmpFmt] = useState(s.cmp_date_format || job.comparison.suggested_date_format || "AUTO");
  const [abs, setAbs] = useState(s.absolute_amounts !== undefined ? s.absolute_amounts : !!job.sap.suggested_absolute);
  const [busy, setBusy] = useState(false);
  const label = cmpLabel(job.comparison_type);
  const tolNum = Number(tol);
  const tolValid = tol !== "" && !Number.isNaN(tolNum) && tolNum >= 0;

  const run = async () => {
    setBusy(true);
    try {
      await api.post(`/jobs/${job.id}/reconcile`, {
        sap_mapping: mapping.sap, cmp_mapping: mapping.comparison, tolerance: tolNum,
        sap_date_format: sapFmt, cmp_date_format: cmpFmt, absolute_amounts: abs,
      });
      toast.success("Reconciliation complete");
      await onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <section className="fade-up grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6 rounded-lg border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-blue-600" />
          <h2 className="font-display text-2xl font-bold">Matching settings</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">Amount tolerance (₹, per field)</label>
          <div className="flex flex-wrap items-center gap-2">
            <Input data-testid="amount-tolerance-input" type="number" min="0" step="0.01" value={tol}
              onChange={(e) => setTol(e.target.value)} className="w-32 border-slate-300 bg-white font-data" />
            {[0, 1, 5, 10].map((v) => (
              <button key={v} data-testid={`tolerance-chip-${v}`} onClick={() => setTol(String(v))}
                className={`rounded border px-2.5 py-1 font-data text-xs transition-colors ${
                  tolNum === v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}>₹{v}</button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Differences up to this amount on taxable value or tax are treated as rounding and noted, not flagged.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateSelect label="SAP date format" value={sapFmt} onChange={setSapFmt} formats={schema.date_formats} testId="sap-date-format-select" detect={!s.sap_date_format ? job.sap.suggested_date_format : null} />
          <DateSelect label={`${label} date format`} value={cmpFmt} onChange={setCmpFmt} formats={schema.date_formats} testId="cmp-date-format-select" detect={!s.cmp_date_format ? job.comparison.suggested_date_format : null} />
        </div>
        <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <Switch data-testid="ignore-sign-toggle" checked={abs} onCheckedChange={setAbs} className="mt-0.5" />
          <span>
            <span className="block text-sm font-medium text-slate-800">Ignore amount sign</span>
            <span className="text-xs text-slate-500">Turn on for ECC / S/4 line-item exports where vendor amounts are negative (credit side, e.g. 1,234.56-).</span>
            {job.sap.suggested_absolute && (
              <span data-testid="ignore-sign-detected" className="mt-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">auto-detected: SAP amounts look negative</span>
            )}
          </span>
        </label>
        <div className="flex justify-between border-t border-slate-200 pt-5">
          <Button data-testid="back-to-mapping-btn" variant="ghost" onClick={onBack} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Mapping
          </Button>
          <Button data-testid="run-reconciliation-btn" onClick={run} disabled={busy || !tolValid}
            className="bg-blue-600 text-white shadow-sm hover:bg-blue-500 active:scale-95">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run validation & matching
          </Button>
        </div>
      </div>
      <aside className="space-y-3 rounded-lg border border-slate-200 p-6 text-sm text-slate-600">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">What gets checked</h3>
        <ul className="space-y-2">
          <li><span className="text-slate-800">Validity</span> — 15-char GSTIN format, invoice no, parseable date, numeric amounts.</li>
          <li><span className="text-slate-800">Duplicates</span> — same GSTIN + invoice no within one file.</li>
          <li><span className="text-slate-800">Pairing</span> — GSTIN + invoice no (ignoring case, spaces, / - and leading zeros).</li>
          <li><span className="text-slate-800">Comparison</span> — taxable value and tax within tolerance, then invoice date.</li>
          <li><span className="text-slate-800">Gaps</span> — in SAP but not in {label}, and vice versa.</li>
        </ul>
        <p className="font-data text-xs text-slate-500">{job.sap.row_count} SAP rows · {job.comparison.row_count} {label} rows</p>
      </aside>
    </section>
  );
};
