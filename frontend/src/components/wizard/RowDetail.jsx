import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { api, errMsg } from "@/lib/api";
import { fmtAmt } from "@/lib/status";

export const RowDetail = ({ row, jobId, cmp, onClose, onUpdate }) => {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setNote(row?.review_note || ""), [row]);
  if (!row) return null;

  const lines = [
    ["Invoice no", row.sap_invoice_no, row.cmp_invoice_no, null],
    ["Invoice date", row.sap_date, row.cmp_date, null],
    ["Taxable value", fmtAmt(row.sap_taxable), fmtAmt(row.cmp_taxable), row.taxable_diff],
    ["Tax amount", fmtAmt(row.sap_tax), fmtAmt(row.cmp_tax), row.tax_diff],
    ["Source row", row.sap_row, row.cmp_row, null],
  ];

  const save = async (reviewed) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/jobs/${jobId}/results/${row.id}`, { reviewed, review_note: note });
      onUpdate(data);
      toast.success(reviewed ? "Marked as reviewed" : "Reopened");
      onClose();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="row-detail-modal" className="max-w-2xl border-slate-200 bg-white text-slate-900">
        <DialogHeader>
          <div className="flex items-center gap-3"><StatusBadge status={row.status} cmp={cmp} testId="row-detail-status" /><span className="font-data text-xs text-slate-500">#{row.seq}</span></div>
          <DialogTitle className="font-data text-base">{row.gstin || "No GSTIN"} <span className="font-sans font-normal text-slate-600">· {row.vendor_name}</span></DialogTitle>
          <DialogDescription className="sr-only">Record comparison detail</DialogDescription>
        </DialogHeader>
        <div data-testid="row-detail-reason" className={`flex gap-2 rounded border p-3 text-sm ${row.status === "MATCHED" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><span>{row.reason}</span>
        </div>
        {row.notes.map((n) => (
          <div key={n} className="flex gap-2 text-xs text-sky-700"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{n}</div>
        ))}
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
            <th className="py-1">Field</th><th className="py-1">SAP (source)</th><th className="py-1">{cmp} (comparison)</th><th className="py-1 text-right">Difference</th>
          </tr></thead>
          <tbody className="font-data text-xs">
            {lines.map(([l, a, b, d]) => (
              <tr key={l} className="border-t border-slate-200">
                <td className="py-2 font-sans text-slate-600">{l}</td><td className="py-2 text-amber-800">{a ?? "—"}</td>
                <td className="py-2 text-sky-700">{b ?? "—"}</td>
                <td className={`py-2 text-right ${d ? "text-red-600" : "text-[#94A3B8]"}`}>{d === null || d === undefined ? "—" : fmtAmt(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Textarea data-testid="review-note-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reviewer note (e.g. vendor contacted, credit note expected)" className="border-slate-300 bg-white text-sm" />
        <div className="flex justify-end gap-2">
          {row.reviewed && <Button data-testid="reopen-flag-btn" variant="ghost" disabled={busy} onClick={() => save(false)} className="hover:bg-slate-100 hover:text-slate-900">Reopen</Button>}
          <Button data-testid="resolve-flag-btn" disabled={busy} onClick={() => save(true)} className="bg-blue-600 text-white hover:bg-blue-500">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{row.reviewed ? "Update note" : "Mark reviewed"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
