export const cmpLabel = (t) => (t === "purchase_register" ? "Purchase Register" : "GSTR-2B");

export const STATUS = {
  MATCHED: { label: () => "Matched", cls: "text-emerald-700 bg-emerald-500/10 border-emerald-600/50" },
  MISSING_IN_COMPARISON: { label: (c) => `Missing in ${c}`, cls: "text-red-700 bg-red-500/10 border-red-600/50" },
  MISSING_IN_SAP: { label: () => "Missing in SAP", cls: "text-amber-700 bg-amber-500/10 border-amber-600/50" },
  AMOUNT_MISMATCH: { label: () => "Amount mismatch", cls: "text-purple-700 bg-purple-500/10 border-purple-600/50" },
  DATE_MISMATCH: { label: () => "Date mismatch", cls: "text-sky-700 bg-sky-500/10 border-sky-600/50" },
  DUPLICATE: { label: () => "Duplicate", cls: "text-pink-700 bg-pink-500/10 border-pink-600/50" },
  INVALID: { label: () => "Invalid", cls: "text-slate-700 bg-slate-500/20 border-slate-500/60" },
};

export const fmtAmt = (v) =>
  v === null || v === undefined
    ? "—"
    : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");
