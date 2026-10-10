import { useEffect, useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtAmt } from "@/lib/status";

const PAGE = 50;
const Diff = ({ v }) => (
  <span className={v ? "text-red-400" : "text-slate-600"}>{v === null || v === undefined ? "—" : fmtAmt(v)}</span>
);

export const ResultsTable = ({ rows, cmp, onSelect }) => {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const th = "px-3 py-2 font-medium whitespace-nowrap";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <div className="max-h-[620px] overflow-auto">
        <table data-testid="review-table" className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-[#0F172A] text-left text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className={th}>#</th><th className={th}>Status</th><th className={th}>Why flagged</th>
              <th className={th}>GSTIN / Vendor</th><th className={th}>Invoice (SAP · {cmp})</th>
              <th className={`${th} text-right`}>Taxable SAP</th><th className={`${th} text-right`}>Taxable {cmp}</th>
              <th className={`${th} text-right`}>Diff</th><th className={`${th} text-right`}>Tax SAP</th>
              <th className={`${th} text-right`}>Tax {cmp}</th><th className={`${th} text-right`}>Diff</th><th className={th}>Reviewed</th>
            </tr>
          </thead>
          <tbody className="font-data">
            {view.map((r) => (
              <tr key={r.id} data-testid="exception-table-row" onClick={() => onSelect(r)}
                className="cursor-pointer border-t border-slate-800/70 transition-colors hover:bg-slate-900">
                <td className="px-3 py-2 text-slate-500">{r.seq}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} cmp={cmp} /></td>
                <td className="min-w-[260px] max-w-[360px] px-3 py-2 font-sans text-slate-300">
                  <div className="line-clamp-2">{r.reason}</div>
                  {r.notes.length > 0 && (
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-sky-300/80"><Info className="h-3 w-3" />{r.notes.length} note(s)</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="text-slate-200">{r.gstin || "—"}</div>
                  <div className="max-w-[180px] truncate font-sans text-slate-500">{r.vendor_name}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="text-amber-200/90">{r.sap_invoice_no || "—"}</div>
                  <div className="text-sky-300/90">{r.cmp_invoice_no || "—"}</div>
                </td>
                <td className="px-3 py-2 text-right">{fmtAmt(r.sap_taxable)}</td>
                <td className="px-3 py-2 text-right">{fmtAmt(r.cmp_taxable)}</td>
                <td className="px-3 py-2 text-right"><Diff v={r.taxable_diff} /></td>
                <td className="px-3 py-2 text-right">{fmtAmt(r.sap_tax)}</td>
                <td className="px-3 py-2 text-right">{fmtAmt(r.cmp_tax)}</td>
                <td className="px-3 py-2 text-right"><Diff v={r.tax_diff} /></td>
                <td className="px-3 py-2">{r.reviewed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <span className="text-slate-600">—</span>}</td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr><td colSpan={12} data-testid="review-table-empty" className="px-3 py-10 text-center font-sans text-slate-500">No records for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-800 bg-[#0F172A] px-3 py-2 text-xs text-slate-500">
        <span data-testid="review-table-count">{rows.length} record(s)</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" data-testid="table-prev-btn" disabled={page === 0} onClick={() => setPage(page - 1)} className="h-7 hover:bg-slate-800 hover:text-white">Prev</Button>
          <span className="font-data">{page + 1}/{pages}</span>
          <Button size="sm" variant="ghost" data-testid="table-next-btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="h-7 hover:bg-slate-800 hover:text-white">Next</Button>
        </div>
      </div>
    </div>
  );
};
