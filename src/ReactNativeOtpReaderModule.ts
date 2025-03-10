import { NativeModule, requireNativeModule } from "expo";

import { ReactNativeOtpReaderModuleEvents } from "./ReactNativeOtpReader.types";

declare class ReactNativeOtpReaderModule extends NativeModule<
  ReactNativeOtpReaderModuleEvents
> {
  startSmsConsent(): string;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ReactNativeOtpReaderModule>(
  "ReactNativeOtpReader"
);
