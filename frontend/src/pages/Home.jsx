import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, FileSpreadsheet, Database, PlayCircle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMsg } from "@/lib/api";
import { RecentJobs } from "@/components/RecentJobs";

const FLOW = ["Upload", "Map columns", "Reconcile", "Review exceptions", "Export"];

export default function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [demoLoading, setDemoLoading] = useState(false);

  const loadJobs = () => api.get("/jobs").then((r) => setJobs(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { loadJobs(); }, []);

  const runDemo = async () => {
    setDemoLoading(true);
    try {
      const { data } = await api.post("/jobs/demo");
      navigate(`/sap/${data.id}`);
    } catch (e) {
      toast.error(errMsg(e));
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-14">
      <section className="fade-up grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="font-data text-xs uppercase tracking-[0.25em] text-blue-600">Choose a reconciliation mode</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            SAP exports against GSTR-2B,
            <span className="text-slate-500"> line by line.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Upload an AP / purchase export from SAP and a GSTR-2B or purchase-register file. Map columns once, match on
            GSTIN, invoice number, date and amounts, and get an Excel exception report with a reason on every flag.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 font-data text-[11px] uppercase tracking-wider text-slate-500">
            {FLOW.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700">{i + 1}. {s}</span>
                {i < FLOW.length - 1 && <ArrowRight className="h-3 w-3" />}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/sap/new"
            data-testid="mode-sap-export-card"
            className="group block rounded-lg border border-blue-200 bg-white shadow-sm p-5 transition-colors duration-200 hover:border-blue-500 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <FileSpreadsheet className="h-6 w-6 text-amber-600" />
              <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">New mode</span>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold">SAP Export Reconciliation</h3>
            <p className="mt-1 text-sm text-slate-600">SAP CSV/XLSX export + GSTR-2B or purchase register → exception Excel.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
              Start reconciliation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <Button
            data-testid="demo-data-button"
            onClick={runDemo}
            disabled={demoLoading}
            variant="outline"
            className="h-12 w-full justify-between border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              {demoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4 text-emerald-600" />}
              Run demo with fictional SAP + GSTR-2B data
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div data-testid="mode-invoice-gstr-card" className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 p-4 text-slate-500">
            <Database className="h-5 w-5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-slate-600">Invoice extraction ↔ GSTR-2B</div>
              <div className="text-xs">Existing prototype workflow — not part of this build</div>
            </div>
            <Lock className="h-4 w-4" />
          </div>
        </div>
      </section>

      <RecentJobs jobs={jobs} />
    </div>
  );
}
