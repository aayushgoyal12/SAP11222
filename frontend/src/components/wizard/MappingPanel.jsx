import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";
const CONF = {
  high: "text-emerald-400 border-emerald-600/50",
  medium: "text-amber-300 border-amber-600/50",
  manual: "text-blue-300 border-blue-600/50",
  none: "text-slate-500 border-slate-700",
};

const TemplateBar = ({ side, templates, meta, value, onChange, onSave }) => {
  const [name, setName] = useState("");
  const apply = (id) => {
    const t = templates.find((x) => x.id === id);
    const next = { ...value };
    let n = 0;
    Object.entries(t.mapping).forEach(([k, col]) => {
      if (col && meta.columns.includes(col)) { next[k] = col; n += 1; }
    });
    onChange(next);
    toast.success(`Applied "${t.name}" — ${n} field(s) set`);
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 px-4 py-3">
      <Select onValueChange={apply} disabled={!templates.length}>
        <SelectTrigger data-testid={`${side}-template-select`} className="h-8 w-48 border-slate-700 bg-slate-900 text-xs">
          <SelectValue placeholder={templates.length ? "Apply saved template" : "No saved templates"} />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input data-testid={`${side}-template-name-input`} value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Template name" className="h-8 w-40 border-slate-700 bg-slate-900 text-xs" />
      <Button data-testid={`${side}-template-save-btn`} size="sm" variant="outline" disabled={!name.trim()}
        onClick={() => { onSave(side, name.trim()); setName(""); }}
        className="h-8 border-slate-700 bg-transparent text-xs text-slate-200 hover:bg-slate-800 hover:text-white">
        <Save className="h-3.5 w-3.5" /> Save mapping
      </Button>
    </div>
  );
};

export const MappingPanel = ({ side, title, accent, meta, schema, value, onChange, templates, onSave }) => {
  const [touched, setTouched] = useState({});
  const sample = (col) => (col ? meta.preview[0]?.[meta.columns.indexOf(col)] ?? "" : "");
  const set = (key, col) => {
    setTouched((t) => ({ ...t, [key]: true }));
    onChange({ ...value, [key]: col === NONE ? null : col });
  };

  return (
    <div data-testid={`${side}-mapping-panel`} className="overflow-hidden rounded-lg border border-slate-800 bg-[#0F172A]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <span className={`font-data text-[11px] uppercase tracking-widest ${accent}`}>{title}</span>
        <span className="truncate font-data text-xs text-slate-500" data-testid={`${side}-file-meta`}>
          {meta.filename} · sheet {meta.sheet} · header row {meta.header_row} · {meta.row_count} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table data-testid={`${side}-column-mapping-table`} className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2 font-medium">Standard field</th>
              <th className="px-2 py-2 font-medium">File column</th>
              <th className="px-2 py-2 font-medium">Detect</th>
              <th className="px-4 py-2 font-medium">Sample</th>
            </tr>
          </thead>
          <tbody>
            {schema.fields.map((f) => {
              const conf = touched[f.key] ? "manual" : value[f.key] ? meta.confidence[f.key] : "none";
              return (
                <tr key={f.key} className="border-t border-slate-800/70">
                  <td className="whitespace-nowrap px-4 py-2 text-slate-200">
                    {f.label}{f.required && <span className="ml-1 text-red-400">*</span>}
                  </td>
                  <td className="px-2 py-1.5">
                    <Select value={value[f.key] || NONE} onValueChange={(c) => set(f.key, c)}>
                      <SelectTrigger data-testid={`${side}-map-${f.key}-select`} className="h-8 min-w-[170px] border-slate-700 bg-slate-950 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— not mapped —</SelectItem>
                        {meta.columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${CONF[conf]}`}>{conf}</span>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-2 font-data text-xs text-slate-400">{sample(value[f.key]) || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TemplateBar side={side} templates={templates} meta={meta} value={value} onChange={onChange} onSave={onSave} />
    </div>
  );
};
