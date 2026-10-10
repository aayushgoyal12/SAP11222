import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "@/components/AppShell";
import Home from "@/pages/Home";
import Wizard from "@/pages/Wizard";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sap/new" element={<Wizard />} />
          <Route path="/sap/:jobId" element={<Wizard />} />
        </Routes>
      </AppShell>
      <Toaster theme="light" position="bottom-right" richColors />
    </BrowserRouter>
  );
}

export default App;
