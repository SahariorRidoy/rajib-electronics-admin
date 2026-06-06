
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const http = async <T = any>(
  url: string,
  method: string = "GET",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any
): Promise<T> => {
  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE;

  const response = await fetch(`${baseURL}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default http;
