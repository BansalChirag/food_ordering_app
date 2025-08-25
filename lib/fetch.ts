import { useState, useEffect, useCallback } from "react";

export const fetchAPI = async (url: string, options?: RequestInit) => {
  try {
    // Ensure URL starts with / for relative paths
    const apiUrl = url.startsWith("/") ? url : `/${url}`;

    console.log("🚀 ~ fetchAPI ~ Making request to:", apiUrl);

    const response = await fetch(apiUrl, options);
    console.log("🚀 ~ fetchAPI ~ response status:", response.status);
    console.log(
      "🚀 ~ fetchAPI ~ response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    console.log("🚀 ~ fetchAPI ~ content-type:", contentType);

    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Expected JSON but got:", textResponse.substring(0, 200));
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    const responseText = await response.text();
    console.log(
      "🚀 ~ fetchAPI ~ responseText:",
      responseText.substring(0, 200)
    );

    if (!responseText) {
      throw new Error("Empty response received");
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Response was:", responseText.substring(0, 200));
      throw new Error(
        `Invalid JSON response: ${responseText.substring(0, 100)}...`
      );
    }
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, options);
      console.log("🚀 ~ useFetch ~ result:", result);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
