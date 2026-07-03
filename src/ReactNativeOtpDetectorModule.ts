import { NativeModule, requireNativeModule } from "expo";

import {
  OtpOptions,
  RetrieverOptions,
  ReactNativeOtpDetectorModuleEvents,
} from "./ReactNativeOtpDetector.types";

declare class ReactNativeOtpDetectorModule extends NativeModule<
  ReactNativeOtpDetectorModuleEvents
> {
  /**
   * Start the SMS User Consent API (Android). Shows a one-tap dialog asking the user
   * to share a single incoming SMS. No app hash required. The OTP is delivered via the
   * `onSmsReceived` event; failures/timeouts via `onOtpError`. No-op on iOS.
   */
  startSmsConsent(options?: OtpOptions): void;

  /**
   * Start the SMS Retriever API (Android). Fully automatic, no user interaction, but the
   * SMS must contain your 11-char app signature hash (see `getAppSignatureHash`) and follow
   * Google's message format. Delivered via `onSmsReceived` / `onOtpError`. No-op on iOS.
   */
  startSmsRetriever(options?: RetrieverOptions): void;

  /**
   * Returns the app signature hash(es) to embed in your OTP SMS for the Retriever API.
   * There is one per signing certificate (debug and release differ). Returns `[]` on iOS.
   */
  getAppSignatureHash(): string[];

  /** Manually stop listening and unregister the SMS broadcast receiver (Android). No-op on iOS. */
  stopListening(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ReactNativeOtpDetectorModule>(
  "ReactNativeOtpDetector"
);
