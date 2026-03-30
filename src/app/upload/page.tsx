"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Shield,
  Server,
  Globe,
  Lock,
  Wifi,
  Database,
  Cloud,
  HardDrive,
} from "lucide-react";
import useUpload from "@/utils/useupload";
import Sidebar from "@/components/Sidebar";

interface FileData {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  size: number;
  name: string;
  url?: string;
  error?: string;
  analysis?: {
    recordCount: number;
    threatsFound: number;
  };
}

interface AnalysisResults {
  totalRecords: number;
  threatsDetected: number;
  suspiciousIPs: number;
  parsingAccuracy: number;
}

export default function LogUpload() {
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [logFormat, setLogFormat] = useState("auto");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [upload, { loading }] = useUpload();
  const pathname = usePathname();

  const logFormats = [
    { id: "auto", name: "Auto-detect", icon: Database, description: "Automatically detect log format" },
    { id: "apache", name: "Apache Access", icon: Server, description: "Apache web server access logs" },
    { id: "nginx", name: "Nginx", icon: Server, description: "Nginx web server logs" },
    { id: "iis", name: "IIS", icon: Globe, description: "Microsoft IIS web server logs" },
    { id: "syslog", name: "Syslog", icon: HardDrive, description: "System logs (RFC 3164/5424)" },
    { id: "windows", name: "Windows Event", icon: Globe, description: "Windows Event logs" },
    { id: "firewall", name: "Firewall", icon: Shield, description: "Firewall logs (various formats)" },
    { id: "auth", name: "Authentication", icon: Lock, description: "Authentication and login logs" },
    { id: "network", name: "Network", icon: Wifi, description: "Network device logs" },
    { id: "cloud", name: "Cloud", icon: Cloud, description: "AWS, Azure, GCP logs" },
  ];

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validExtensions = ['.log', '.txt', '.json', '.csv', '.xml'];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return validExtensions.includes(extension) || file.type.includes('text');
    });

    setSelectedFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending' as const,
      size: file.size,
      name: file.name
    }))]);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    for (const fileData of selectedFiles) {
      if (fileData.status !== 'pending') continue;

      try {
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }));
        
        // Update status to uploading
        setSelectedFiles(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, status: 'uploading' } : f)
        );

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileData.id] || 0;
            if (current >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [fileData.id]: current + 10 };
          });
        }, 200);

        // Upload file
        const { url, error } = await upload({ 
          file: fileData.file
        });

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }));

        if (error) {
          setSelectedFiles(prev => 
            prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error } : f)
          );
        } else {
          // Process the uploaded log file
          const response = await fetch('/api/logs/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fileUrl: url, 
              format: logFormat,
              fileName: fileData.name 
            })
          });

          if (response.ok) {
            const result = await response.json();
            setSelectedFiles(prev => 
              prev.map(f => f.id === fileData.id ? { 
                ...f, 
                status: 'completed',
                url,
                analysis: result
              } : f)
            );
          } else {
            throw new Error('Failed to process log file');
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
        setSelectedFiles(prev => 
          prev.map(f => f.id === fileData.id ? { 
            ...f, 
            status: 'error', 
            error: errorMessage 
          } : f)
        );
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-20 p-6 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Security Logs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Upload and analyze security logs from various sources</p>
          </div>

          {/* Log Format Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Log Format</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {logFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setLogFormat(format.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    logFormat === format.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/40"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                >
                  <format.icon 
                    size={24} 
                    className={`mb-2 ${
                      logFormat === format.id ? "text-blue-600" : "text-gray-400"
                    }`} 
                  />
                  <div>
                    <div className={`text-sm font-medium ${
                      logFormat === format.id ? "text-blue-900 dark:text-blue-200" : "text-gray-900 dark:text-white"
                    }`}>
                      {format.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Log Files</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop log files here or click to browse
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Supports .log, .txt, .json, .csv, .xml files up to 10MB each
              </p>
              <input
                type="file"
                multiple
                accept=".log,.txt,.json,.csv,.xml"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer"
              >
                Select Files
              </label>
            </div>

            {/* Supported Formats Info */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Supported Log Formats:</h4>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p>• Apache/Nginx access logs (Common/Combined format)</p>
                <p>• Windows Event logs (.evtx exported as XML/CSV)</p>
                <p>• Syslog (RFC 3164/5424)</p>
                <p>• Firewall logs (pfSense, iptables, Cisco ASA)</p>
                <p>• Cloud logs (AWS CloudTrail, Azure Activity, GCP Audit)</p>
              </div>
            </div>
          </div>

          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Files</h2>
                <button
                  onClick={uploadFiles}
                  disabled={loading || selectedFiles.every(f => f.status !== 'pending')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Upload & Analyze'}
                </button>
              </div>

              <div className="space-y-3">
                {selectedFiles.map((fileData) => (
                  <div key={fileData.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center flex-1">
                      <FileText size={20} className="text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{fileData.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(fileData.size)}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        {fileData.status === 'uploading' && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[fileData.id] || 0}%` }}
                            ></div>
                          </div>
                        )}

                        {/* Status Messages */}
                        {fileData.status === 'error' && (
                          <div className="flex items-center mt-2 text-red-600 text-sm">
                            <AlertCircle size={16} className="mr-1" />
                            {fileData.error || 'Upload failed'}
                          </div>
                        )}

                        {fileData.status === 'completed' && (
                          <div className="flex items-center mt-2 text-green-600 text-sm">
                            <CheckCircle size={16} className="mr-1" />
                            Processed successfully
                            {fileData.analysis && (
                              <span className="ml-2 text-gray-600 dark:text-gray-300">
                                ({fileData.analysis.recordCount} records, {fileData.analysis.threatsFound} threats)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResults && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysisResults.totalRecords}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Records</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{analysisResults.threatsDetected}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Threats Detected</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{analysisResults.suspiciousIPs}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Suspicious IPs</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analysisResults.parsingAccuracy}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Parsing Accuracy</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}