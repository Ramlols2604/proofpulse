"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// Simple API client
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
  const client = axios.create({
    baseURL: API_BASE,
  });
  
  client.interceptors.request.use((config) => {
    config.headers["x-client-id"] = getClientId();
    return config;
  });
  
  return client;
}

const apiClient = createApiClient();

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemo?: (results: any) => void;
  onJobCreated?: (jobId: string) => void;
}

interface UserSettings {
  gemini_enabled: boolean;
  demo_mode: "cached" | "live";
}

export default function Settings({ isOpen, onClose, onLoadDemo, onJobCreated }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings>({
    gemini_enabled: false,
    demo_mode: "cached",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoStatus, setDemoStatus] = useState("");

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get("/settings");
      setSettings({
        gemini_enabled: response.data.gemini_enabled,
        demo_mode: response.data.demo_mode,
      });
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setSaved(false);
    
    try {
      await apiClient.post("/settings", settings);
      
      // Also save to localStorage for offline access
      if (typeof window !== "undefined") {
        localStorage.setItem("proofpulse_settings", JSON.stringify(settings));
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    if (!onLoadDemo || !onJobCreated) return;
    
    setDemoLoading(true);
    setDemoStatus("");
    
    try {
      if (settings.demo_mode === "cached") {
        // Use cached demo
        setDemoStatus("Loading cached demo...");
        const response = await apiClient.get("/demo");
        onLoadDemo(response.data);
        onClose(); // Close settings after loading demo
      } else {
        // Run live demo
        setDemoStatus("Starting live demo...");
        const response = await apiClient.post("/live", {
          text: "Global carbon emissions increased by 5.2% in 2023. Renewable energy adoption grew by 12% worldwide. Electric vehicle sales exceeded 10 million units for the first time."
        });
        
        const jobId = response.data.job_id;
        onJobCreated(jobId);
        setDemoStatus("Processing live demo...");
        
        // Poll for results
        let attempts = 0;
        const maxAttempts = 60;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const statusResponse = await apiClient.get(`/status?job_id=${jobId}`);
          const currentStatus = statusResponse.data.status;
          
          setDemoStatus(`Status: ${currentStatus}`);
          
          if (currentStatus === "READY") {
            const resultResponse = await apiClient.get(`/result?job_id=${jobId}`);
            onLoadDemo(resultResponse.data);
            onClose(); // Close settings after demo completes
            break;
          } else if (currentStatus === "FAILED") {
            throw new Error("Demo processing failed");
          }
          
          attempts++;
        }
      }
      
      setDemoLoading(false);
      setDemoStatus("");
    } catch (err: any) {
      setDemoStatus(`Error: ${err.response?.data?.detail || err.message || "Demo failed"}`);
      setDemoLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-slate-200">Use Gemini Scoring</div>
                  <div className="text-sm text-slate-500">Enable AI-powered detailed claim analysis</div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.gemini_enabled}
                    onChange={(e) => setSettings({ ...settings, gemini_enabled: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-8 rounded-full transition-colors ${
                      settings.gemini_enabled ? "bg-blue-600" : "bg-slate-600"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        settings.gemini_enabled ? "transform translate-x-6" : ""
                      }`}
                    />
                  </div>
                </div>
              </label>
              {settings.gemini_enabled && (
                <div className="mt-2 text-xs text-amber-400 bg-amber-900/30 p-2 rounded border border-amber-700">
                  ⚠️ Requires Gemini API quota. Falls back to Backboard if unavailable.
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-200 mb-2">Demo Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, demo_mode: "cached" })}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    settings.demo_mode === "cached"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <div className="text-sm">⚡ Cached</div>
                  <div className="text-xs opacity-80">Instant</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, demo_mode: "live" })}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    settings.demo_mode === "live"
                      ? "bg-green-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <div className="text-sm">🔴 Live</div>
                  <div className="text-xs opacity-80">Real APIs</div>
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {settings.demo_mode === "cached"
                  ? "Demo loads instantly from cache (no API calls)"
                  : "Demo runs through full pipeline with real APIs"}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={handleLoadDemo}
              disabled={demoLoading || !onLoadDemo}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                settings.demo_mode === "cached"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } disabled:bg-slate-600 disabled:cursor-not-allowed`}
            >
              <span>{settings.demo_mode === "cached" ? "⚡" : "🔴"}</span>
              <span>
                {demoLoading
                  ? "Loading..."
                  : settings.demo_mode === "cached"
                    ? "Load Demo (Instant)"
                    : "Run Live Demo"}
              </span>
            </button>
            {demoStatus && <div className="mt-2 text-sm text-center text-slate-400">{demoStatus}</div>}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="flex-1 bg-slate-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors border border-slate-600"
            >
              {loading ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors border border-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
