import { registerWebModule, NativeModule } from 'expo';

import { ReactNativeOtpReaderModuleEvents } from './ReactNativeOtpReader.types';

class ReactNativeOtpReaderModule extends NativeModule<ReactNativeOtpReaderModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ReactNativeOtpReaderModule);
