import { sleep } from "@/lib/retry";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    throw new ApiClientError(
      data?.error ?? "Request gagal. Silakan coba lagi.",
      response.status
    );
  }

  return data as T;
}

export async function postJsonWithRateLimitRetry<T>(
  url: string,
  payload: unknown
): Promise<T> {
  const delays = [1000, 2000, 4000];

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await postJson<T>(url, payload);
    } catch (error) {
      if (
        !(error instanceof ApiClientError) ||
        error.status !== 429 ||
        attempt === delays.length
      ) {
        throw error;
      }

      await sleep(delays[attempt]);
    }
  }

  throw new ApiClientError("Request gagal. Silakan coba lagi.", 500);
}
