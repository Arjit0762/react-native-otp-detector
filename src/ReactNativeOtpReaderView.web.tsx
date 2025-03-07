import * as React from 'react';

import { ReactNativeOtpReaderViewProps } from './ReactNativeOtpReader.types';

export default function ReactNativeOtpReaderView(props: ReactNativeOtpReaderViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
