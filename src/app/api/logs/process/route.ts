import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
);

/* --------------------------------------------
   Interfaces
--------------------------------------------- */

interface LogAnalysis {
  recordCount: number;
  threatsFound: number;
  parsingAccuracy: number;
  fileSize: number;
}

/* --------------------------------------------
   MAIN POST HANDLER
--------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const { fileUrl, format = "auto", fileName } = await request.json();

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Mock analysis generation
    const mockAnalysis = await processLogFile(fileUrl, format, fileName);

    // Insert record into log_files
    const { data: fileRecord, error: fileError } = await supabase
      .from("log_files")
      .insert([
        {
          filename: fileName,
          file_url: fileUrl,
          file_size: mockAnalysis.fileSize,
          log_format: format,
          processed: true,
          record_count: mockAnalysis.recordCount,
          threats_found: mockAnalysis.threatsFound,
          parsing_accuracy: mockAnalysis.parsingAccuracy,
          upload_date: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (fileError) throw fileError;

    // Generate log entries + threats
    await generateSampleLogEntries(fileRecord.id, format, mockAnalysis.recordCount);
    await generateSampleThreats(fileRecord.id, mockAnalysis.threatsFound);

    // Update metrics
    await updateSystemMetrics(mockAnalysis);

    return NextResponse.json({
      success: true,
      fileId: fileRecord.id,
      recordCount: mockAnalysis.recordCount,
      threatsFound: mockAnalysis.threatsFound,
      parsingAccuracy: mockAnalysis.parsingAccuracy,
      message: "Log file processed successfully",
    });
  } catch (error) {
    console.error("Log processing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process log file" },
      { status: 500 }
    );
  }
}

/* --------------------------------------------
   MOCK LOG PROCESSING (SIMULATION)
--------------------------------------------- */
async function processLogFile(
  fileUrl: string,
  format: string,
  fileName: string
): Promise<LogAnalysis> {
  const formatAnalysis: Record<string, LogAnalysis> = {
    apache: {
      recordCount: rand(5000, 15000),
      threatsFound: rand(10, 60),
      parsingAccuracy: randFloat(95, 99),
      fileSize: rand(1_000_000, 5_000_000),
    },
    nginx: {
      recordCount: rand(3000, 11000),
      threatsFound: rand(5, 35),
      parsingAccuracy: randFloat(96, 99),
      fileSize: rand(500_000, 3_000_000),
    },
    firewall: {
      recordCount: rand(8000, 23000),
      threatsFound: rand(20, 120),
      parsingAccuracy: randFloat(92, 98),
      fileSize: rand(2_000_000, 8_000_000),
    },
    syslog: {
      recordCount: rand(2000, 7000),
      threatsFound: rand(3, 25),
      parsingAccuracy: randFloat(98, 100),
      fileSize: rand(500_000, 2_000_000),
    },
    auto: {
      recordCount: rand(3000, 10000),
      threatsFound: rand(8, 50),
      parsingAccuracy: randFloat(94, 99),
      fileSize: rand(1_000_000, 4_000_000),
    },
  };

  return formatAnalysis[format] || formatAnalysis["auto"];
}

/* --------------------------------------------
   GENERATE SAMPLE LOG ENTRIES
--------------------------------------------- */
async function generateSampleLogEntries(
  fileId: number,
  format: string,
  recordCount: number
) {
  const sampleCount = Math.min(recordCount, 100);
  const entries: any[] = [];

  for (let i = 0; i < sampleCount; i++) {
    entries.push({
      file_id: fileId,
      recorded_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      log_level: randomChoice(["info", "warn", "error", "debug"]),
      source_ip: generateRandomIP(),
      destination_ip: generateRandomIP(),
      source_port: rand(1, 65535),
      destination_port: randomChoice([80, 443, 22, 53, 3389]),
      protocol: randomChoice(["TCP", "UDP", "ICMP"]),
      action: randomChoice(["ACCEPT", "DROP", "REJECT"]),
      message: generateLogMessage(format),
      request_method: randomChoice(["GET", "POST", "PUT", "DELETE"]),
      request_uri: generateRandomURI(),
      response_status: randomChoice([200, 404, 500, 403]),
      response_size: rand(1000, 100000),
      raw_log: `Sample log entry ${i + 1}`,
    });
  }

  // Insert in batches
  for (let i = 0; i < entries.length; i += 20) {
    const batch = entries.slice(i, i + 20);
    const { error } = await supabase.from("log_entries").insert(batch);
    if (error) console.error("Insert log entries error:", error);
  }
}

/* --------------------------------------------
   GENERATE SAMPLE THREATS
--------------------------------------------- */
async function generateSampleThreats(fileId: number, threatCount: number) {
  const threatTypes = [
    "SQL Injection",
    "XSS Attack",
    "Brute Force",
    "Port Scan",
    "DDoS Attack",
    "Malware Detection",
    "Unauthorized Access",
  ];

  const severities = ["low", "medium", "high", "critical"];
  const statuses = ["active", "blocked", "monitored"];

  const sampleCount = Math.min(threatCount, 50);
  const threats: any[] = [];

  for (let i = 0; i < sampleCount; i++) {
    threats.push({
      file_id: fileId,
      threat_type: randomChoice(threatTypes),
      severity: randomChoice(severities),
      confidence_score: randFloat(0.5, 1.0),
      source_ip: generateRandomIP(),
      description: "Automated threat detection based on log patterns",
      status: randomChoice(statuses),
      detected_at: new Date().toISOString(),
    });
  }

  const { error } = await supabase.from("threats").insert(threats);
  if (error) console.error("Insert threats error:", error);
}

/* --------------------------------------------
   SYSTEM METRIC UPDATES
--------------------------------------------- */
async function updateSystemMetrics(analysis: LogAnalysis) {
  const metrics = [
    { name: "logs_processed_today", value: analysis.recordCount, unit: "count" },
    { name: "threats_detected_today", value: analysis.threatsFound, unit: "count" },
    { name: "parsing_success_rate", value: analysis.parsingAccuracy, unit: "percentage" },
  ];

  for (const metric of metrics) {
    const { data: existing } = await supabase
      .from("system_metrics")
      .select("*")
      .eq("metric_name", metric.name)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("system_metrics")
        .update({
          metric_value: (existing.metric_value || 0) + metric.value,
        })
        .eq("metric_name", metric.name);
    } else {
      await supabase.from("system_metrics").insert([
        {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_unit: metric.unit,
        },
      ]);
    }
  }
}

/* --------------------------------------------
   UTILITY FUNCTIONS
--------------------------------------------- */
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randFloat = (min: number, max: number) =>
  +(Math.random() * (max - min) + min).toFixed(2);

const randomChoice = <T>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const generateRandomIP = () =>
  `${rand(1, 255)}.${rand(1, 255)}.${rand(1, 255)}.${rand(1, 255)}`;

function generateLogMessage(format: string): string {
  const messages: Record<string, string[]> = {
    apache: ["GET /index", "POST /auth", "GET /dashboard"],
    firewall: ["Blocked connection", "Suspicious port scan", "Traffic allowed"],
    syslog: ["User login", "Service started", "Config updated"],
  };

  return randomChoice(messages[format] || ["Event recorded"]);
}

function generateRandomURI() {
  const paths = ["/", "/login", "/admin", "/api/data", "/upload"];
  return randomChoice(paths);
}
