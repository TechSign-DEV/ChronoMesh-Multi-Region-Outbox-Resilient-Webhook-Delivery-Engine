
export const isRetryableHttpStatus = (status) => {
  if (!Number.isInteger(status)) {
    return true;
  }

  // Retry temporary and rate-limited responses.
  if ([408, 409, 425, 429].includes(status)) {
    return true;
  }

  // Retry server-side failures.
  if (status >= 500 && status <= 599) {
    return true;
  }

  // Do not retry permanent client errors or redirects.
  return false;
};

export const getDeliveryFailureReason = (status) => {
  if (!Number.isInteger(status)) {
    return "No valid HTTP response was received";
  }

  if (status >= 300 && status < 400) {
    return `Redirect response rejected: HTTP ${status}`;
  }

  if (status >= 400 && status < 500) {
    return `Webhook rejected the request: HTTP ${status}`;
  }

  if (status >= 500) {
    return `Webhook server error: HTTP ${status}`;
  }

  return `Unexpected webhook response: HTTP ${status}`;
};
