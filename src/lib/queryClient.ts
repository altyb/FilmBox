import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 60 * 60_000,
      /* Don't burn quota retrying hopeless requests: 401/403/404/400 fail
       * fast, while 429/5xx/network get two more tries with backoff. The
       * axios layer already retries 429s with Retry-After before this. */
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
    },
  },
});
