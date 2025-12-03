const API_BASE_URL = "http://localhost:5000";

export async function apiRequest(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body;
  let headers = options.headers || {};
  if (!(body instanceof FormData)) {
    headers = Object.assign({ "Content-Type": "application/json" }, headers);
  }
  const response = await fetch(API_BASE_URL + path, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }
  if (!response.ok) {
    const message = data && data.message ? data.message : "Request failed";
    throw new Error(message);
  }
  return data;
}

export { API_BASE_URL };
