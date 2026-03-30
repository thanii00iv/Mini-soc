import * as React from "react";

type UploadInput =
  | { file: File }
  | { url: string }
  | { base64: string }
  | { buffer: ArrayBuffer };

type UploadResult = {
  url?: string;
  mimeType?: string | null;
  error?: string;
  file?: {
    name?: string;
    url?: string;
    size?: number;
    mimeType?: string;
  };
  fileName?: string;
  fileUrl?: string;
};

function useUpload(): [
  (input: UploadInput) => Promise<UploadResult>,
  { loading: boolean }
] {
  const [loading, setLoading] = React.useState(false);

  const upload = React.useCallback(async (input: UploadInput): Promise<UploadResult> => {
    try {
      setLoading(true);

      const UPLOAD_URL = "/api/upload";
      let response: Response;

      // ---- FILE UPLOAD ----
      if ("file" in input && input.file) {
        const formData = new FormData();
        formData.append("file", input.file);

        response = await fetch(UPLOAD_URL, {
          method: "POST",
          body: formData,
        });
      }

      // ---- URL UPLOAD ----
      else if ("url" in input) {
        response = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: input.url }),
        });
      }

      // ---- BASE64 UPLOAD ----
      else if ("base64" in input) {
        response = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: input.base64 }),
        });
      }

      // ---- BUFFER UPLOAD ----
      else if ("buffer" in input) {
        response = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: input.buffer,
        });
      }

      else {
        throw new Error("Invalid upload input");
      }

      // -------------------------
      // Handle API errors
      // -------------------------
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Upload failed: File too large.");
        }
        throw new Error("Upload failed.");
      }

      // -------------------------
      // Parse response
      // -------------------------
      let data: any = {};
      const contentType = response.headers.get("Content-Type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      // Normalize all possible server responses
      const fileUrl =
        data.url ||
        data.fileUrl ||
        data.file?.url ||
        data.uploadedUrl ||
        null;

      return {
        url: fileUrl,
        mimeType: data.mimeType || data.file?.mimeType || null,
        file: data.file,
        fileName: data.file?.name,
        fileUrl,
      };

    } catch (err: any) {
      return {
        error: err?.message || "Upload failed",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
export default useUpload;
