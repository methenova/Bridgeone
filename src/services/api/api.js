const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function apiRequest(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    }
  );

  if (!response.ok) {
    throw new Error("API Request Failed");
  }

  return response.json();
}