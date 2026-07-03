# react-native-otp-detector

Automatic OTP/SMS detection on **Android** using Google Play services. It supports **both** of Google's SMS verification APIs in a single package:

- **SMS User Consent API** — shows a one-tap dialog asking the user to share a single incoming SMS. No app hash, no special SMS format, works with any sender.
- **SMS Retriever API** — fully automatic, zero user interaction. Requires your 11-character [app signature hash](https://developers.google.com/identity/sms-retriever/verify) to be embedded in the SMS and the message to follow Google's format.

Both modes deliver the extracted OTP through the same `onSmsReceived` event and report problems through `onOtpError`.

> **iOS:** there is no programmatic equivalent on iOS. All functions are safe no-ops there. Use the system one-time-code autofill instead by setting `textContentType="oneTimeCode"` on your OTP `TextInput`.

## Installation

```
npm install react-native-otp-detector
```

For bare React Native projects, ensure you have [installed and configured `expo` modules](https://docs.expo.dev/bare/installing-expo-modules/). Then run `npx pod-install` (the iOS side is a no-op but the pod must be present).

## Which API should I use?

| | SMS User Consent | SMS Retriever |
| --- | --- | --- |
| User interaction | One-tap dialog | None (automatic) |
| App signature hash | Not required | **Required** |
| SMS format | Any | Must end with the app hash, ≤ 140 bytes |
| Control over SMS body | Not needed | You must control it |
| Sender filtering | Optional | N/A |

Use **Consent** when you don't control the SMS format. Use **Retriever** when your backend can append the app hash and format the message.

## Usage

### SMS User Consent API

```ts
import { useEffect } from "react";
import { Platform } from "react-native";
import OtpDetector from "react-native-otp-detector";

useEffect(() => {
  const received = OtpDetector.addListener("onSmsReceived", ({ otp, message }) => {
    console.log("OTP:", otp, "from message:", message);
    // setOtp(otp)
  });
  const error = OtpDetector.addListener("onOtpError", ({ message }) => {
    console.warn("OTP error:", message);
  });

  if (Platform.OS === "android") {
    // Listen first, then trigger your backend to send the SMS.
    OtpDetector.startSmsConsent({ otpLength: 6 });
  }

  return () => {
    received.remove();
    error.remove();
    OtpDetector.stopListening();
  };
}, []);
```

### SMS Retriever API

```ts
if (Platform.OS === "android") {
  OtpDetector.startSmsRetriever({ otpLength: 6 });
}
```

Your SMS must contain the OTP and end with the app hash, for example:

```
<#> Your code is 123456
FA+9qCX9VSu
```

### Getting your app signature hash (Retriever only)

```ts
const hashes = OtpDetector.getAppSignatureHash();
console.log(hashes); // e.g. ["FA+9qCX9VSu"]
```

There is one hash per signing certificate, so **your debug and release builds produce different hashes** — make sure your production SMS uses the release hash.

## API

| Method | Description |
| --- | --- |
| `startSmsConsent(options?)` | Start the User Consent flow. `options`: `{ senderPhoneNumber?, otpLength?, otpRegex? }`. |
| `startSmsRetriever(options?)` | Start the automatic Retriever flow. `options`: `{ otpLength?, otpRegex? }`. |
| `getAppSignatureHash()` | Returns `string[]` of app signature hashes (empty on iOS). |
| `stopListening()` | Unregister the SMS receiver and stop listening. |
| `addListener("onSmsReceived", cb)` | `cb({ otp, message })` when an OTP is detected. |
| `addListener("onOtpError", cb)` | `cb({ message })` on timeout, denied consent, or no OTP found. |

OTP extraction defaults to any 4–8 digit sequence. Pass `otpLength` for an exact length, or `otpRegex` for full control.

## Contributing

Contributions are very welcome! Please open an issue or PR on the [repository](https://github.com/Arjit0762/react-native-otp-detector).
