import { Check } from "lucide-react";

const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "map", label: "Map columns" },
  { key: "reconcile", label: "Reconcile" },
  { key: "review", label: "Review exceptions" },
  { key: "export", label: "Export" },
];

export const Stepper = ({ step, setStep, hasJob, reconciled }) => {
  const enabled = (i) => (i === 0 ? !hasJob : i <= 2 ? hasJob : reconciled);
  return (
    <nav data-testid="wizard-stepper" className="flex gap-1 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60 p-1">
      {STEPS.map((s, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <button
            key={s.key}
            data-testid={`step-${s.key}-tab`}
            disabled={!enabled(i)}
            onClick={() => setStep(i)}
            className={`flex min-w-[130px] flex-1 items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium transition-colors duration-200 sm:text-sm ${
              active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400`}
          >
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border font-data text-[10px] ${
              active ? "border-white/60" : done ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : "border-slate-600"
            }`}>
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="whitespace-nowrap">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
