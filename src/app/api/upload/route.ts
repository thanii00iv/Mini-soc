import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    /* ----------------------------------------------------
       📌 1. MULTIPART FORM DATA (actual files)
    ---------------------------------------------------- */
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 }
        );
      }

      // Convert File → Buffer → Text
      const arrayBuffer = await file.arrayBuffer();
      const textContent = Buffer.from(arrayBuffer).toString("utf-8");

      // Normally you'd upload to S3, Supabase storage, etc.
      const fakeUrl = `/uploads/${Date.now()}-${file.name}`;

      return NextResponse.json({
        success: true,
        message: "File uploaded successfully",
        file: {
          name: file.name,
          size: file.size,
          mimeType: file.type,
          url: fakeUrl,
          content: textContent, // remove if you don't want to return entire file text
        },
      });
    }

    /* ----------------------------------------------------
       📌 2. RAW JSON (URL or Base64 content)
    ---------------------------------------------------- */
    const jsonBody = await req.json();

    return NextResponse.json({
      success: true,
      message: "JSON upload received",
      url: jsonBody.url || "base64-data",
      mimeType: jsonBody.mimeType ?? "application/json",
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed", details: error?.message },
      { status: 500 }
    );
  }
}
