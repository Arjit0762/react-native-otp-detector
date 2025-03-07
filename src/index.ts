// Reexport the native module. On web, it will be resolved to ReactNativeOtpReaderModule.web.ts
// and on native platforms to ReactNativeOtpReaderModule.ts
export { default } from './ReactNativeOtpReaderModule';
export { default as ReactNativeOtpReaderView } from './ReactNativeOtpReaderView';
export * from  './ReactNativeOtpReader.types';
