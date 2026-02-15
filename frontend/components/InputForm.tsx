"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";

function getClientId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";
  let clientId = localStorage.getItem("proofpulse_client_id");
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem("proofpulse_client_id", clientId);
  }
  return clientId;
}

function createApiClient() {
  const client = axios.create({ baseURL: API_BASE });
  client.interceptors.request.use((config) => {
    config.headers["x-client-id"] = getClientId();
    return config;
  });
  return client;
}

const apiClient = createApiClient();

const TABS = [
  { id: "video", label: "Video Upload", type: "video" },
  { id: "document", label: "Document Upload", type: "pdf" },
  { id: "url", label: "URL", type: "url" },
  { id: "text", label: "Text", type: "text" },
];

interface InputFormProps {
  onJobCreated: (jobId: string) => void;
  onResults: (results: any) => void;
}

export default function InputForm({ onJobCreated, onResults }: InputFormProps) {
  const [activeTabId, setActiveTabId] = useState("video");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMode, setDemoMode] = useState<"cached" | "live">("cached");

  useEffect(() => {
    apiClient.get("/settings").then((r) => setDemoMode(r.data.demo_mode || "cached")).catch(() => {});
  }, []);

  const inputType = TABS.find((t) => t.id === activeTabId)?.type ?? "text";
  const isFileTab = inputType === "video" || inputType === "pdf";
  const canSubmit = isFileTab ? !!file : content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("Uploading...");
    try {
      const formData = new FormData();
      formData.append("type", inputType);
      if (inputType === "text" || inputType === "url" || inputType === "txt") {
        formData.append("content", content);
      } else if (file) {
        formData.append("file", file);
      }
      const ingestResponse = await apiClient.post("/ingest", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const jobId = ingestResponse.data.job_id;
      onJobCreated(jobId);
      setStatus("Processing...");
      await apiClient.post(`/process?job_id=${jobId}`);

      let attempts = 0;
      const maxAttempts = 60;
      const pollStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) throw new Error("Processing timeout");
        const statusResponse = await apiClient.get(`/status?job_id=${jobId}`);
        const currentStatus = statusResponse.data.status;
        setStatus(`Status: ${currentStatus}`);
        if (currentStatus === "READY") {
          const resultResponse = await apiClient.get(`/result?job_id=${jobId}`);
          onResults(resultResponse.data);
          setLoading(false);
          return;
        }
        if (currentStatus === "FAILED") {
          throw new Error(statusResponse.data.message || "Processing failed");
        }
        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
        return pollStatus();
      };
      await pollStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "An error occurred");
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    setError("");
    try {
      await apiClient.get("/demo");
      const resultResponse = await apiClient.get("/result?job_id=demo");
      onResults(resultResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Demo failed");
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const fileAccept = inputType === "video" ? "video/*" : ".pdf";
  const fileHint = inputType === "video" ? "Video (MP4, MOV) supported" : "PDF supported";

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl shadow-indigo-500/10 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-700/80">
          {TABS.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
                  isActive ? "text-blue-300 bg-slate-700/50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                }`}
              >
                {tab.label}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {isFileTab && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-12 px-6 transition-all ${
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-slate-600 hover:border-slate-500"
              }`}
            >
              <div className="rounded-full bg-slate-700/80 p-4 mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-slate-300 font-medium mb-1">Drag and drop file</p>
              <p className="text-sm text-slate-500">{fileHint}</p>
              <input
                type="file"
                accept={fileAccept}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
                required={isFileTab}
              />
              <label htmlFor="file-upload" className="mt-4 cursor-pointer text-sm text-blue-400 hover:text-blue-300 font-medium">
                {file ? file.name : "Or click to browse"}
              </label>
            </div>
          )}

          {(inputType === "url" || inputType === "text") && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-400">
                {inputType === "url" ? "Enter URL" : "Paste text content"}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={inputType === "url" ? "https://..." : "Paste the text you want to verify..."}
                className="w-full h-32 px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                required={inputType === "url" || inputType === "text"}
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="flex-1 bg-slate-800 border border-slate-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Analyze File"}
            </button>
            <button
              type="button"
              onClick={handleDemo}
              disabled={demoLoading || loading}
              className="flex-1 bg-slate-700/50 border border-slate-600 text-slate-200 py-3 px-6 rounded-lg font-semibold hover:bg-slate-600/50 disabled:opacity-50 transition-colors"
            >
              {demoLoading ? "Loading..." : "Try Demo Clip"}
            </button>
          </div>

          {status && (
            <div className="mt-4 text-center text-sm text-slate-400 bg-slate-700/30 py-2 px-4 rounded-lg">
              {status}
            </div>
          )}
          {error && (
            <div className="mt-4 text-center text-sm text-red-400 bg-red-900/20 py-2 px-4 rounded-lg border border-red-800/50">
              {error}
            </div>
          )}
        </form>
      </div>

      <p className="mt-8 text-sm text-slate-500 text-center">
        Powered by TwelveLabs • Backboard • Valkey
      </p>
    </div>
  );
}
