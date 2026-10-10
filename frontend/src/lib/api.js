import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const api = axios.create({ baseURL: API });

export const errMsg = (e) => {
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x) => x.msg).join("; ");
  return d || e?.message || "Request failed";
};

export const reportUrl = (jobId, kind) => `${API}/jobs/${jobId}/report?kind=${kind}`;
export const demoFileUrl = (kind) => `${API}/demo/files/${kind}`;
