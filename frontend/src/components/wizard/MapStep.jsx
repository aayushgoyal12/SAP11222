import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMsg } from "@/lib/api";
import { cmpLabel } from "@/lib/status";
import { MappingPanel } from "./MappingPanel";

export const mappingErrors = (schema, map) => {
  const errs = schema.fields.filter((f) => f.required && !map[f.key]).map((f) => `${f.label} not mapped`);
  if (!map.tax_amount && !map.igst && !map.cgst && !map.sgst) errs.push("Map Total Tax Amount or IGST/CGST/SGST");
  return errs;
};

export const MapStep = ({ job, schema, mapping, setMapping, onNext }) => {
  const [templates, setTemplates] = useState([]);
  const loadTemplates = () => api.get("/templates").then((r) => setTemplates(r.data));
  useEffect(() => { loadTemplates(); }, []);

  const saveTemplate = async (side, name) => {
    try {
      await api.post("/templates", { name, side, mapping: mapping[side] });
      toast.success(`Template "${name}" saved`);
      loadTemplates();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const setSide = (side) => (m) => setMapping((prev) => ({ ...prev, [side]: m }));
  const errors = [
    ...mappingErrors(schema, mapping.sap).map((e) => `SAP: ${e}`),
    ...mappingErrors(schema, mapping.comparison).map((e) => `${cmpLabel(job.comparison_type)}: ${e}`),
  ];

  return (
    <section className="fade-up space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Map columns to the standard schema</h2>
        <p className="mt-1 text-sm text-slate-400">
          Auto-detected from known SAP and GSTR-2B header aliases. Confirm or change each field; save layouts as templates for the next client.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <MappingPanel side="sap" title="SAP export" accent="text-amber-400" meta={job.sap} schema={schema}
          value={mapping.sap} onChange={setSide("sap")} templates={templates.filter((t) => t.side === "sap")} onSave={saveTemplate} />
        <MappingPanel side="comparison" title={cmpLabel(job.comparison_type)} accent="text-sky-400" meta={job.comparison} schema={schema}
          value={mapping.comparison} onChange={setSide("comparison")} templates={templates.filter((t) => t.side === "comparison")} onSave={saveTemplate} />
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div data-testid="mapping-errors" className="text-sm">
          {errors.length ? (
            <span className="flex items-start gap-2 text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{errors.join(" · ")}</span>
          ) : (
            <span className="text-emerald-400">All required fields mapped on both sides.</span>
          )}
        </div>
        <Button data-testid="mapping-continue-btn" disabled={errors.length > 0} onClick={onNext}
          className="bg-blue-600 text-white hover:bg-blue-500 active:scale-95">
          Continue to settings <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};
