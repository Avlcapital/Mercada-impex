const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");
export async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.message || "The service is unavailable. Please try again.",
    );
  return data;
}
