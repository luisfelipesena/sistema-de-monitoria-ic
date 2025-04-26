export async function fetchApi(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  return res;
}