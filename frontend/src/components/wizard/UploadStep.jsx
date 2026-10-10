import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Download, Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errMsg, demoFileUrl } from "@/lib/api";
import { cmpLabel } from "@/lib/status";
import { FileDrop } from "./FileDrop";

const SAMPLES = [
  ["sap_csv", "SAP export (CSV)"],
  ["sap_xlsx", "SAP export (XLSX)"],
  ["gstr2b_xlsx", "GSTR-2B (XLSX)"],
  ["gstr2b_csv", "GSTR-2B (CSV)"],
];

export const UploadStep = () => {
  const navigate = useNavigate();
  const [sap, setSap] = useState(null);
  const [cmp, setCmp] = useState(null);
  const [type, setType] = useState("gstr2b");
  const [busy, setBusy] = useState(null);

  const submit = async () => {
    setBusy("upload");
    const fd = new FormData();
    fd.append("sap_file", sap);
    fd.append("comparison_file", cmp);
    fd.append("comparison_type", type);
    try {
      const { data } = await api.post("/jobs", fd);
      toast.success("Files parsed — confirm the column mapping");
      navigate(`/sap/${data.id}`);
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(null);
    }
  };

  const demo = async () => {
    setBusy("demo");
    try {
      const { data } = await api.post("/jobs/demo");
      navigate(`/sap/${data.id}`);
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(null);
    }
  };

  return (
    <section className="fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Upload exports</h2>
          <p className="mt-1 text-sm text-slate-400">Text-based CSV/XLSX only. Header rows and the right sheet are detected automatically.</p>
        </div>
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">Comparison file type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger data-testid="comparison-type-select" className="border-slate-700 bg-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gstr2b" data-testid="comparison-type-gstr2b">GSTR-2B</SelectItem>
              <SelectItem value="purchase_register" data-testid="comparison-type-purchase-register">Purchase register</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FileDrop testId="sap-file" title="Source · SAP export" accent="text-amber-400" file={sap} onFile={setSap}
          hint="e.g. SAP Business One AP invoice export, or any SAP purchase report saved as CSV/XLSX." />
        <FileDrop testId="gstr2b-file" title={`Comparison · ${cmpLabel(type)}`} accent="text-sky-400" file={cmp} onFile={setCmp}
          hint={type === "gstr2b" ? "GSTR-2B B2B sheet downloaded from the GST portal (XLSX) or a CSV of it." : "Purchase register exported from your books."} />
      </div>

      <div className="flex flex-col-reverse gap-4 border-t border-slate-800 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="mr-1 uppercase tracking-wider">Fictional samples:</span>
          {SAMPLES.map(([k, l]) => (
            <a key={k} href={demoFileUrl(k)} data-testid={`sample-${k}-link`}
              className="inline-flex items-center gap-1 rounded border border-slate-800 px-2 py-1 text-slate-300 transition-colors hover:border-slate-600 hover:text-white">
              <Download className="h-3 w-3" /> {l}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="load-demo-data-btn" variant="outline" onClick={demo} disabled={!!busy}
            className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white">
            {busy === "demo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4 text-emerald-400" />}
            Load demo data
          </Button>
          <Button data-testid="upload-continue-btn" onClick={submit} disabled={!sap || !cmp || !!busy}
            className="bg-blue-600 text-white hover:bg-blue-500 active:scale-95">
            {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Parse files & map columns <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
