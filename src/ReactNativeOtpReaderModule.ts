import { NativeModule, requireNativeModule } from 'expo';

import { ReactNativeOtpReaderModuleEvents } from './ReactNativeOtpReader.types';

declare class ReactNativeOtpReaderModule extends NativeModule<ReactNativeOtpReaderModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ReactNativeOtpReaderModule>('ReactNativeOtpReader');
