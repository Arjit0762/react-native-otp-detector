import type { StyleProp, ViewStyle } from "react-native";

export type OnLoadEventPayload = {
  url: string;
};

export type ReactNativeOtpDetectorModuleEvents = {
  onSmsReceived: (params: SmsReceivedPayload) => void;
};

export type SmsReceivedPayload = {
  otp: string;
};