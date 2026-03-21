export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type ApiErrorPayload = {
  detail?: unknown;
};

function normalizeDetail(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "string" && first.trim()) {
      return first;
    }
    if (first && typeof first === "object" && "msg" in first) {
      const msg = first.msg;
      if (typeof msg === "string" && msg.trim()) {
        return msg;
      }
    }
  }

  if (detail && typeof detail === "object" && "msg" in detail) {
    const msg = detail.msg;
    if (typeof msg === "string" && msg.trim()) {
      return msg;
    }
  }

  return "Request failed.";
}

function toUserFriendlyMessage(message: string): string {
  if (message.includes("real_name must be 10 characters or fewer")) {
    return "Name must be 10 characters or fewer.";
  }
  if (message.includes("major must be 20 characters or fewer")) {
    return "Major must be 20 characters or fewer.";
  }
  if (message.includes("real_name must not contain links")) {
    return "Name cannot contain links or special markup.";
  }
  if (message.includes("major must not contain links")) {
    return "Major cannot contain links or special markup.";
  }
  if (message.includes("real_name may only contain")) {
    return "Name can only contain Korean, English, and spaces.";
  }
  if (message.includes("major may only contain")) {
    return "Major can only contain Korean, English, numbers, spaces, and basic separators.";
  }
  if (message.includes("show_name=true")) {
    return "Enter a name before choosing to show it publicly.";
  }
  if (message.includes("show_major=true")) {
    return "Enter a major before choosing to show it publicly.";
  }
  if (message.includes("Profile settings can only be saved")) {
    return "You can only save profile settings 5 times per day.";
  }
  if (message.includes("Failed to send verification email")) {
    return "Failed to send verification email. Please try again in a moment.";
  }
  if (message.includes("Verification request could not be completed")) {
    return "Verification request could not be completed. Please wait and try again.";
  }
  if (message.includes("Verification could not be completed")) {
    return "Verification could not be completed. Check your email and code, then try again.";
  }
  if (message.includes("Only @yonsei.ac.kr email addresses are allowed")) {
    return "Only @yonsei.ac.kr email addresses are allowed.";
  }
  if (message.includes("Please wait before requesting another code")) {
    return "Please wait before requesting another verification code.";
  }
  if (message.includes("Verification code expired")) {
    return "Verification code expired. Request a new code.";
  }
  if (message.includes("Too many verification attempts")) {
    return "Too many verification attempts. Request a new code.";
  }
  if (message.includes("Invalid verification code")) {
    return "Invalid verification code.";
  }
  if (message.includes("No active verification request")) {
    return "No active verification request for this email.";
  }
  if (message.includes("Authentication required")) {
    return "Your session expired. Sign in with GitHub again.";
  }
  return message;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = "Request failed.";
    try {
      const data = (await response.json()) as ApiErrorPayload;
      if (data.detail) {
        detail = toUserFriendlyMessage(normalizeDetail(data.detail));
      }
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}
