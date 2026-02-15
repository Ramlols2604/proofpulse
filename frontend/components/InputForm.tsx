"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// Simple API client
const API_BASE = "http://localhost:8000";

// Function to get or create client ID
function getClientId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";
  
  let clientId = localStorage.getItem("proofpulse_client_id");
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem("proofpulse_client_id", clientId);
  }
  return clientId;
}

// Create API client
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

interface InputFormProps {
  onJobCreated: (jobId: string) => void;
  onResults: (results: any) => void;
}

export default function InputForm({ onJobCreated, onResults }: InputFormProps) {
  const [inputType, setInputType] = useState<string>("text");
  const [content, setContent] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState<"cached" | "live">("cached");

  // Load demo mode from settings
  useEffect(() => {
    const loadDemoMode = async () => {
      try {
        const response = await apiClient.get("/settings");
        setDemoMode(response.data.demo_mode || "cached");
      } catch (err) {
        // Default to cached on error
        setDemoMode("cached");
      }
    };
    loadDemoMode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("Uploading...");

    try {
      // Step 1: Ingest
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

      // Step 2: Start Processing
      await apiClient.post(`/process?job_id=${jobId}`);

      // Step 3: Poll Status
      let attempts = 0;
      const maxAttempts = 60;
      
      const pollStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error("Processing timeout");
        }

        const statusResponse = await apiClient.get(`/status?job_id=${jobId}`);
        const currentStatus = statusResponse.data.status;
        
        setStatus(`Status: ${currentStatus}`);

        if (currentStatus === "READY") {
          // Step 4: Get Results
          const resultResponse = await apiClient.get(`/result?job_id=${jobId}`);
          onResults(resultResponse.data);
          setLoading(false);
          return;
        } else if (currentStatus === "FAILED") {
          throw new Error(statusResponse.data.message || "Processing failed");
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        return pollStatus();
      };

      await pollStatus();

    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Input Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["text", "url", "video", "pdf"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setInputType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputType === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Content Input */}
        {(inputType === "text" || inputType === "url" || inputType === "txt") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {inputType === "url" ? "URL" : "Content"}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                inputType === "url"
                  ? "Enter URL to verify..."
                  : "Enter text content to verify..."
              }
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
              required
            />
          </div>
        )}

        {/* File Upload */}
        {(inputType === "video" || inputType === "pdf") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload {inputType.toUpperCase()} File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept={inputType === "video" ? "video/*" : ".pdf"}
                className="hidden"
                id="file-upload"
                required
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                {file ? file.name : `Click to upload ${inputType} file`}
              </label>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (!content && !file)}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing..." : "Verify Claims"}
        </button>


        {/* Status Display */}
        {status && (
          <div className="text-center text-sm text-gray-600 bg-blue-50 py-2 px-4 rounded-lg">
            {status}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-center text-sm text-red-600 bg-red-50 py-2 px-4 rounded-lg">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
