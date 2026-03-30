"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProcessPage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("auto");
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "done" | "error"
  >("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a log file first.");
      return;
    }

    try {
      setStatus("uploading");
      setError(null);

      // 🧩 Upload to Supabase Storage
      const filePath = `uploads/${Date.now()}-${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("logs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Generate public URL
      const { data: publicUrlData } = supabase.storage
        .from("logs")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // 🧩 Call /api/process
      setStatus("processing");
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          format,
          fileName: file.name,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Processing failed");
      }

      setResult(data);
      setStatus("done");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message);
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-sky-400 mb-6">Log File Processor</h1>

        {/* File Upload */}
        <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-sky-500 transition mb-4">
          <input
            type="file"
            accept=".log,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="fileUpload"
          />
          <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-2">
            <UploadCloud className="w-10 h-10 text-sky-400" />
            <span className="text-slate-300">
              {file ? (
                <span className="font-medium text-sky-300">{file.name}</span>
              ) : (
                "Click or drag a log file here"
              )}
            </span>
          </label>
        </div>

        {/* Format Selection */}
        <div className="flex items-center justify-between mb-6">
          <label htmlFor="format" className="text-slate-400 font-medium">
            Log Format:
          </label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="auto">Auto Detect</option>
            <option value="apache">Apache</option>
            <option value="nginx">Nginx</option>
            <option value="firewall">Firewall</option>
            <option value="syslog">Syslog</option>
          </select>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={status === "uploading" || status === "processing"}
          className={`w-full py-2.5 rounded-lg font-medium transition ${
            status === "uploading" || status === "processing"
              ? "bg-sky-700 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-500"
          }`}
        >
          {status === "uploading"
            ? "Uploading..."
            : status === "processing"
            ? "Processing..."
            : "Upload & Analyze"}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {status === "done" && result && (
          <div className="mt-6 space-y-4 bg-slate-800/60 border border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Log File Processed Successfully
            </div>

            <div className="grid grid-cols-2 gap-4 text-slate-300">
              <MetricCard label="Records Processed" value={result.recordCount} />
              <MetricCard label="Threats Detected" value={result.threatsFound} />
              <MetricCard label="Parsing Accuracy" value={`${result.parsingAccuracy}%`} />
              <MetricCard label="File ID" value={result.fileId} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center shadow-inner">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-lg font-bold text-sky-400">{value}</p>
    </div>
  );
}
