import { STATUS } from "@/lib/status";

export const StatusBadge = ({ status, cmp, testId }) => {
  const s = STATUS[status];
  return (
    <span
      data-testid={testId}
      className={`inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}
    >
      {s.label(cmp)}
    </span>
  );
};
