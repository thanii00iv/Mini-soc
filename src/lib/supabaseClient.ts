import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

// Custom fetch with better error handling
const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  try {
    // Preserve headers regardless of type (Headers | Record | Array)
    const headers = new Headers();
    if (options?.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => headers.set(key, value));
      } else if (Array.isArray(options.headers)) {
        for (const [key, value] of options.headers as Array<[string, string]>) {
          headers.set(key, value);
        }
      } else if (typeof options.headers === "object") {
        for (const [key, value] of Object.entries(options.headers as Record<string, string>)) {
          headers.set(key, value);
        }
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Check if response is ok, if not, provide better error info
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("Supabase API error:", response.status, errorText);
    }
    
    return response;
  } catch (error) {
    // Handle network errors more gracefully
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      const urlStr = typeof url === "string" ? url : url.toString();
      console.error("Failed to fetch from:", urlStr);
      
      // Provide more specific error message
      const errorMessage = urlStr.includes("supabase")
        ? "Unable to connect to Supabase. Please check:\n1. Your internet connection\n2. NEXT_PUBLIC_SUPABASE_URL is set correctly\n3. Supabase project is active\n4. CORS settings allow your domain"
        : "Network error: Unable to connect to the server. Please check your internet connection.";
      
      throw new Error(errorMessage);
    }
    throw error;
  }
};

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Validate environment variables
    if (!url || !anonKey) {
      const missingVars = [];
      if (!url) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
      if (!anonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      
      throw new Error(
        `Missing Supabase configuration. Please set the following environment variables in your .env.local file:\n${missingVars.join("\n")}\n\nExample:\nNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`
      );
    }

    // Validate URL format
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      if (!validatedUrl.hostname.includes("supabase")) {
        console.warn("Warning: Supabase URL doesn't contain 'supabase' in hostname. Please verify the URL is correct.");
      }
    } catch {
      throw new Error(
        `Invalid Supabase URL format: "${url}". Please check NEXT_PUBLIC_SUPABASE_URL. It should be a valid URL like https://your-project.supabase.co`
      );
    }

    // Validate anon key format (should be a JWT-like string)
    if (anonKey.length < 50) {
      console.warn("Warning: Supabase anon key seems unusually short. Please verify it's correct.");
    }

    try {
      supabase = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
        global: {
          fetch: customFetch,
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        },
      });
    } catch (error) {
      console.error("Error creating Supabase client:", error);
      throw new Error(
        `Failed to initialize Supabase client. Please verify your configuration.\n${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  return supabase;
}
