const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");
export async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("mercada:unauthorized"));
    const error = new Error(
      data.message || "The service is unavailable. Please try again.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
