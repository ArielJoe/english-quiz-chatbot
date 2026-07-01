interface RetryOptions {
  retries?: number;
  delaysMs?: number[];
  shouldRetry?: (error: unknown) => boolean;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as {
    status?: number;
    statusCode?: number;
    code?: number | string;
    message?: string;
  };

  return (
    maybeError.status === 429 ||
    maybeError.statusCode === 429 ||
    maybeError.code === 429 ||
    maybeError.code === "429" ||
    maybeError.message?.toLowerCase().includes("429") === true ||
    maybeError.message?.toLowerCase().includes("rate limit") === true ||
    maybeError.message?.toLowerCase().includes("quota") === true
  );
}

export function isInvalidApiKeyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as {
    status?: number;
    statusCode?: number;
    code?: number | string;
    message?: string;
  };

  const message = maybeError.message?.toLowerCase() ?? "";
  const status = maybeError.status ?? maybeError.statusCode;

  return (
    (status === 400 || status === 401) &&
    (message.includes("api_key_invalid") ||
      message.includes("invalid_api_key") ||
      message.includes("api key not valid") ||
      message.includes("invalid api key"))
  );
}

export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const delaysMs = options.delaysMs ?? [1000, 2000, 4000];
  const shouldRetry = options.shouldRetry ?? isRateLimitError;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      await sleep(delaysMs[attempt] ?? delaysMs[delaysMs.length - 1]);
    }
  }

  throw lastError;
}
