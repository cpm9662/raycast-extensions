export interface FetchTextOptions extends RequestInit {
  timeoutMs?: number;
}

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "User-Agent": "Raycast Chemical Search/1.0",
};

export async function fetchText(
  url: string,
  options: FetchTextOptions = {},
): Promise<string> {
  const { timeoutMs = 15000, headers, ...requestInit } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...requestInit,
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Request failed with ${response.status} ${response.statusText}`,
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
