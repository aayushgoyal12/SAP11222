import { Link } from "react-router-dom";
import { ChevronRight, History } from "lucide-react";
import { fmtDate, cmpLabel } from "@/lib/status";

export const RecentJobs = ({ jobs }) => (
  <section data-testid="recent-jobs" className="fade-up" style={{ animationDelay: "120ms" }}>
    <div className="mb-3 flex items-center gap-2">
      <History className="h-4 w-4 text-slate-500" />
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Recent reconciliation jobs</h2>
    </div>
    {jobs.length === 0 ? (
      <p data-testid="recent-jobs-empty" className="rounded-lg border border-slate-200 p-6 text-sm text-slate-500">
        No jobs yet. Start a reconciliation or run the demo.
      </p>
    ) : (
      <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
        {jobs.map((j) => (
          <Link
            key={j.id}
            to={`/sap/${j.id}`}
            data-testid={`recent-job-${j.id}`}
            className="flex flex-wrap items-center gap-x-6 gap-y-1 bg-white px-4 py-3 text-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{j.name}</span>
            <span className="font-data text-xs text-slate-500">{cmpLabel(j.comparison_type)}</span>
            {j.summary ? (
              <span className="font-data text-xs text-slate-600">
                <span className="text-emerald-600">{j.summary.matched}</span> matched ·{" "}
                <span className="text-amber-700">{j.summary.requires_review}</span> to review
              </span>
            ) : (
              <span className="font-data text-xs text-slate-500">not reconciled</span>
            )}
            <span className="font-data text-xs text-slate-500">{fmtDate(j.created_at)}</span>
            <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
          </Link>
        ))}
      </div>
    )}
  </section>
);
