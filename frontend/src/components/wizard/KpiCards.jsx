const card = (key, label, value, color, filter, sub) => ({ key, label, value, color, filter, sub });

export const KpiCards = ({ summary: s, cmp, filter, setFilter }) => {
  const cards = [
    card("total-records", "Total SAP records", s.total_records, "text-slate-900", "ALL", `${s.cmp_records} in ${cmp}`),
    card("matched", "Matched", s.matched, "text-emerald-600", "MATCHED", `${s.match_rate}% of SAP`),
    card("missing-gstr", `Missing in ${cmp}`, s.missing_in_cmp, "text-red-600", "MISSING_IN_COMPARISON", `${s.missing_in_sap} missing in SAP`),
    card("mismatch", "Amount mismatches", s.amount_mismatch, "text-purple-700", "AMOUNT_MISMATCH", `${s.date_mismatch} date mismatch`),
    card("duplicates", "Duplicates", s.duplicates, "text-pink-600", "DUPLICATE", `${s.invalid} invalid`),
    card("review-required", "Requires review", s.requires_review, "text-amber-700", "EXCEPTIONS", "all non-matched rows"),
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c, i) => (
        <button
          key={c.key}
          data-testid={`kpi-${c.key}`}
          onClick={() => setFilter(c.filter)}
          style={{ animationDelay: `${i * 50}ms` }}
          className={`fade-up rounded-lg border bg-white shadow-sm p-4 text-left transition-[border-color,background-color] duration-200 hover:bg-slate-50 ${
            filter === c.filter ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{c.label}</div>
          <div data-testid={`kpi-${c.key}-value`} className={`mt-2 font-data text-3xl font-semibold ${c.color}`}>{c.value}</div>
          <div className="mt-1 truncate text-xs text-slate-500">{c.sub}</div>
        </button>
      ))}
    </div>
  );
};
