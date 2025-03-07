import { requireNativeView } from 'expo';
import * as React from 'react';

import { ReactNativeOtpReaderViewProps } from './ReactNativeOtpReader.types';

const NativeView: React.ComponentType<ReactNativeOtpReaderViewProps> =
  requireNativeView('ReactNativeOtpReader');

export default function ReactNativeOtpReaderView(props: ReactNativeOtpReaderViewProps) {
  return <NativeView {...props} />;
}
