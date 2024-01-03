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

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36';

export const GENERIC_API_ERROR = 'There was an error trying to process this API call';

export const NO_PRODUCTS_FOUND = 'No Products Found.';

export const TIME_OUT_ERROR_NAME = 'TimeoutError';

export const TIMEOUT_MSG = 'Timeout Error.';