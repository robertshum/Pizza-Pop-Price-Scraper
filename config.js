export const PORT = "3000";
export const TESTING_PORT = "3001";
export const DEFAULT_SEARCH_TIMEOUT = 30 * 1000;

// 2m * 60s * 1000ms
export const DEFAULT_TIMEOUT = 2 * 60 * 1000;

// 15m
export const DEFAULT_LIMITER_WINDOWMS = 15 * 60 * 1000;

// maximum 100 requests allowed per windowMs
export const DEFAULT_LIMITER_MAX_REQUESTS = 100;

export const MSG_EXCEEDED_REQUESTS = 'You have exceeded the requests in a 24 hr period.';