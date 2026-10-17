const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 12000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiFetch(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Sirf safe requests ko automatically retry karenge.
  const canRetry = ["GET", "HEAD", "OPTIONS"].includes(method);

  let lastError = null;

  for (let attempt = 0; attempt <= (canRetry ? MAX_RETRIES : 0); attempt++) {
    const controller = new AbortController();
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT);

    const externalSignal = options.signal;

    const abortRequest = () => controller.abort();

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener("abort", abortRequest, {
          once: true,
        });
      }
    }

    try {
      const { signal, ...requestOptions } = options;

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...requestOptions,
        method,
        headers: {
          ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
          ...(options.headers || {}),
        },
        credentials: "include",
        signal: controller.signal,
      });

      // Temporary server errors par safe requests dobara try hongi.
      const temporaryError = [502, 503, 504].includes(response.status);

      if (
        temporaryError &&
        canRetry &&
        attempt < MAX_RETRIES &&
        !externalSignal?.aborted
      ) {
        await response.body?.cancel().catch(() => {});
        await wait(800 * (attempt + 1));
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = {
          message: response.ok
            ? "The server returned an unexpected response."
            : "The request could not be completed.",
        };
      }

      return {
        success: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      lastError = error;

      if (externalSignal?.aborted) {
        return {
          success: false,
          status: 0,
          data: {
            message: "Request cancelled.",
          },
        };
      }

      // GET/HEAD/OPTIONS par limited retry.
      if (canRetry && attempt < MAX_RETRIES) {
        await wait(800 * (attempt + 1));
        continue;
      }

      console.warn(
        "API request failed:",
        endpoint,
        timedOut ? "Request timed out." : error.message,
      );

      return {
        success: false,
        status: 0,
        data: {
          message: timedOut
            ? "The server is taking longer than expected. Please try again."
            : "We’re having trouble connecting. Please try again in a moment.",
        },
      };
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortRequest);
    }
  }

  return {
    success: false,
    status: 0,
    data: {
      message:
        lastError?.name === "AbortError"
          ? "The server is taking longer than expected. Please try again."
          : "We’re having trouble connecting. Please try again in a moment.",
    },
  };
}
