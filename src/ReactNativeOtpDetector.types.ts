export type SmsReceivedPayload = {
  /** The OTP extracted from the message using the active regex / otpLength. */
  otp: string;
  /** The full SMS message text the OTP was extracted from. */
  message: string;
};

export type OtpErrorPayload = {
  /** Human-readable description of what went wrong (timeout, denied consent, no OTP, etc.). */
  message: string;
};

export type OtpOptions = {
  /**
   * Consent API only. Restricts the consent prompt to messages from this sender's
   * phone number. Omit to accept a message from any sender.
   */
  senderPhoneNumber?: string;
  /** Expected OTP length, e.g. 6 → matches `\d{6}`. Ignored if `otpRegex` is set. */
  otpLength?: number;
  /** Custom regex (as a string) used to extract the OTP. Overrides `otpLength`. */
  otpRegex?: string;
};

/** Options accepted by the fully-automatic SMS Retriever API (no sender filter). */
export type RetrieverOptions = Pick<OtpOptions, "otpLength" | "otpRegex">;

export type ReactNativeOtpDetectorModuleEvents = {
  onSmsReceived: (params: SmsReceivedPayload) => void;
  onOtpError: (params: OtpErrorPayload) => void;
};
