import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { Stepper } from "@/components/wizard/Stepper";
import { UploadStep } from "@/components/wizard/UploadStep";
import { MapStep } from "@/components/wizard/MapStep";
import { ReconcileStep } from "@/components/wizard/ReconcileStep";
import { ReviewStep } from "@/components/wizard/ReviewStep";
import { ExportStep } from "@/components/wizard/ExportStep";

export default function Wizard() {
  const { jobId } = useParams();
  const [schema, setSchema] = useState(null);
  const [job, setJob] = useState(null);
  const [results, setResults] = useState([]);
  const [mapping, setMapping] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(!!jobId);

  useEffect(() => { api.get("/schema").then((r) => setSchema(r.data)); }, []);

  const load = useCallback(async (goto) => {
    const { data } = await api.get(`/jobs/${jobId}`);
    setJob(data);
    setMapping(data.mapping || { sap: data.sap.suggested_mapping, comparison: data.comparison.suggested_mapping });
    if (data.status === "reconciled") setResults((await api.get(`/jobs/${jobId}/results`)).data);
    setStep(goto ?? (data.status === "reconciled" ? 3 : 1));
  }, [jobId]);

  useEffect(() => {
    if (!jobId) { setJob(null); setStep(0); setLoading(false); return; }
    setLoading(true);
    load().catch((e) => toast.error(errMsg(e))).finally(() => setLoading(false));
  }, [jobId, load]);

  const updateResult = (r) => setResults((rs) => rs.map((x) => (x.id === r.id ? r : x)));

  if (loading || (jobId && !schema)) {
    return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>;
  }

  return (
    <div data-testid="wizard" className="space-y-8">
      <Stepper step={step} setStep={setStep} hasJob={!!job} reconciled={job?.status === "reconciled"} />
      {step === 0 && <UploadStep />}
      {step === 1 && job && <MapStep job={job} schema={schema} mapping={mapping} setMapping={setMapping} onNext={() => setStep(2)} />}
      {step === 2 && job && <ReconcileStep job={job} schema={schema} mapping={mapping} onBack={() => setStep(1)} onDone={() => load(3)} />}
      {step === 3 && job && <ReviewStep job={job} results={results} onUpdate={updateResult} onNext={() => setStep(4)} />}
      {step === 4 && job && <ExportStep job={job} results={results} />}
    </div>
  );
}
