import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";

export const FileDrop = ({ title, hint, file, onFile, accent, testId }) => {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  const pick = (f) => f && onFile(f);

  return (
    <div
      data-testid={`${testId}-dropzone`}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
      className={`relative flex min-h-[200px] cursor-pointer flex-col justify-between rounded-lg border-2 border-dashed p-5 transition-colors duration-200 ${
        over ? "border-blue-500 bg-blue-600/10" : file ? "border-emerald-600/60 bg-emerald-500/[0.04]" : "border-slate-700 bg-slate-950/40 hover:border-slate-500"
      }`}
    >
      <input
        ref={ref}
        type="file"
        accept=".csv,.xlsx,.xlsm"
        data-testid={`${testId}-input`}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <div className="flex items-center justify-between">
        <span className={`font-data text-[11px] uppercase tracking-widest ${accent}`}>{title}</span>
        {file && (
          <button
            data-testid={`${testId}-clear`}
            onClick={(e) => { e.stopPropagation(); onFile(null); if (ref.current) ref.current.value = ""; }}
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {file ? (
        <div className="flex items-center gap-3" data-testid={`${testId}-selected`}>
          <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-100">{file.name}</div>
            <div className="font-data text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 text-slate-400">
          <Upload className="h-6 w-6" />
          <span className="text-sm">Drop a CSV / XLSX here or <span className="text-blue-400 underline">browse</span></span>
        </div>
      )}
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
};
