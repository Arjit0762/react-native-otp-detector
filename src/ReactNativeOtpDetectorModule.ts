import { NativeModule, requireNativeModule } from "expo";

import { ReactNativeOtpDetectorModuleEvents } from "./ReactNativeOtpDetector.types";

declare class ReactNativeOtpDetectorModule extends NativeModule<
  ReactNativeOtpDetectorModuleEvents
> {
  startSmsConsent(): string;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ReactNativeOtpDetectorModule>(
  "ReactNativeOtpDetector"
);
