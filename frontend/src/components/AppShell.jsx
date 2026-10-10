import { Link } from "react-router-dom";
import { ShieldAlert, Layers } from "lucide-react";

export const Disclaimer = () => (
  <div data-testid="disclaimer-banner" className="border-b border-amber-200 bg-amber-50">
    <div className="mx-auto flex max-w-[1500px] items-start gap-2 px-4 py-2 text-xs text-amber-900 sm:px-8">
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        <strong className="font-semibold">Review assistance only.</strong> Flags records for human review — not tax or
        legal advice, and nothing is posted to SAP or the GST portal. Works on exported files only; no live SAP connection.
      </span>
    </div>
  </div>
);

export const AppShell = ({ children }) => (
  <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
    <header data-testid="app-header" className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-8">
        <Link to="/" data-testid="home-link" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded bg-blue-600">
            <Layers className="h-4 w-4 text-white" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">GST Recon Desk</span>
        </Link>
        <span className="hidden font-data text-[11px] uppercase tracking-widest text-slate-500 sm:block">
          Exports in · Exceptions out
        </span>
      </div>
    </header>
    <Disclaimer />
    <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 sm:py-10">{children}</main>
  </div>
);
