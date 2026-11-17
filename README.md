<h1 align="center">react-native-otp-detector</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-otp-detector"><img alt="npm" src="https://img.shields.io/npm/v/react-native-otp-detector.svg"></a>
  <a href="https://www.npmjs.com/package/react-native-otp-detector"><img alt="downloads" src="https://img.shields.io/npm/dm/react-native-otp-detector.svg"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/npm/l/react-native-otp-detector.svg"></a>
  <img alt="Android" src="https://img.shields.io/badge/Android-Google%20Play%20services-3DDC84.svg?logo=android">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-Modules-000020.svg?logo=expo">
</p>

<p align="center">
  <strong>Automatic OTP detection for React Native on Android.</strong><br>
  Google's SMS User Consent API and SMS Retriever API in one Expo module: a one-tap consent dialog or fully automatic retrieval, no SMS permissions, typed events, and a helper for your app signature hash.
</p>

<p align="center">
  Built on the <a href="https://docs.expo.dev/modules/overview/">Expo Modules API</a> ·
  Android backed by Google Play services'
  <a href="https://developers.google.com/identity/sms-retriever/overview">SMS Retriever</a> and
  <a href="https://developers.google.com/identity/sms-retriever/user-consent/overview">SMS User Consent</a> APIs
</p>

---

## Why this library

Reading a one-time password out of an SMS used to mean asking for `READ_SMS`, a permission Google Play restricts to a few kinds of app. Google Play services has two APIs that need no permission at all, and this package puts both behind one small, typed API:

- **SMS User Consent API** — Play services shows a one-tap dialog asking the user to share a single incoming message. No app hash, no special message format.
- **SMS Retriever API** — fully automatic, with no user interaction, for messages that carry your app's signature hash.
- **No SMS permissions** — nothing to declare in the manifest and nothing for the user to grant.
- **One pair of events for both** — `onSmsReceived` gives you the extracted code and the full message; `onOtpError` reports a timeout, a denied consent or a message with no code in it.
- **OTP extraction built in** — any 4 to 8 digit code by default, an exact length with `otpLength`, or your own pattern with `otpRegex`.
- **App signature hash helper** — `getAppSignatureHash()` returns the 11-character hash the Retriever API needs, for the build that is running.
- **Only Play services can deliver the message** — the receiver is registered behind Play services' own send permission, so another app on the device cannot feed it a forged code.
- **Safe to call on iOS** — every function is a no-op there, so the same code runs on both platforms.

---

## Table of contents

- [Install](#install)
  - [Requirements](#requirements)
- [Which API should I use?](#which-api-should-i-use)
- [Quickstart](#quickstart)
  - [SMS User Consent API](#sms-user-consent-api)
  - [SMS Retriever API](#sms-retriever-api)
  - [App signature hash](#app-signature-hash)
- [iOS](#ios)
- [API](#api)
  - [Methods](#methods)
  - [Options](#options)
  - [Events](#events)
  - [Types](#types)
- [How listening works](#how-listening-works)
- [Common pitfalls](#common-pitfalls)
- [Contributing](#contributing)
- [FAQ](#faq)
- [Acknowledgements](#acknowledgements)
- [License](#license)

---

## Install

```sh
npm install react-native-otp-detector
# or
yarn add react-native-otp-detector
```

The package has native code, so the app needs a new native build afterwards:

- **Expo** — make a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (`npx expo run:android`, or EAS Build). There is no config plugin to add. It does not run in Expo Go.
- **Bare React Native** — [install and configure Expo modules](https://docs.expo.dev/bare/installing-expo-modules/) if the project doesn't have them yet, then run `npx pod-install` for iOS and rebuild.

### Requirements

| | |
|---|---|
| Expo modules | The package is an Expo module, autolinked like any other. A project without `expo` needs it installed first (see above) |
| Android | A device with Google Play services. The library adds `play-services-auth-api-phone` 18.1.0 and asks for no permissions |
| iOS | 15.1 or later. The module is there so the app links and the JS calls don't fail; it does nothing ([iOS](#ios)) |
| Tested on | Expo SDK 52 / React Native 0.76, which the example app runs on and CI builds for Android and iOS, and Expo SDK 58 / React Native 0.88 |

---

## Which API should I use?

| | SMS User Consent | SMS Retriever |
|---|---|---|
| User interaction | One-tap dialog | None |
| App signature hash in the SMS | Not needed | **Required** |
| Message format | Any message with a 4 to 10 character code that has at least one digit | At most 140 bytes, containing the code and the hash |
| Who has to control the SMS text | Nobody | You |
| Sender filter | Optional (`senderPhoneNumber`) | None |
| Sender in the user's contacts | Message is ignored | Works |

Use **User Consent** when you can't change the SMS your provider sends. Use **Retriever** when your backend can add the app hash to the message, and you want the code filled in with no tap.

---

## Quickstart

Both modes deliver the code through the same two events, so subscribe once and then start whichever mode you want. Start listening **before** you ask your backend to send the SMS.

### SMS User Consent API

```tsx
import { useEffect } from "react";
import { Platform } from "react-native";
import OtpDetector from "react-native-otp-detector";

export function useOtp(onOtp: (otp: string) => void) {
  useEffect(() => {
    const received = OtpDetector.addListener("onSmsReceived", ({ otp, message }) => {
      console.log("OTP", otp, "from", message);
      onOtp(otp);
    });
    const failed = OtpDetector.addListener("onOtpError", ({ message }) => {
      console.warn("OTP not detected:", message);
    });

    if (Platform.OS === "android") {
      OtpDetector.startSmsConsent({ otpLength: 6 });
    }

    return () => {
      received.remove();
      failed.remove();
      OtpDetector.stopListening();
    };
  }, []);
}
```

When a matching SMS arrives, Play services asks the user whether the app may read that one message. On "Allow" the code arrives in `onSmsReceived`; on "Deny" you get `onOtpError`.

### SMS Retriever API

Same listeners, a different start call:

```ts
if (Platform.OS === "android") {
  OtpDetector.startSmsRetriever({ otpLength: 6 });
}
```

The SMS has to contain the code and your app's hash, in at most 140 bytes:

```
Your code is 123456

FA+9qCX9VSu
```

Google documents the format in [Perform SMS verification on a server](https://developers.google.com/identity/sms-retriever/verify).

### App signature hash

```ts
const hashes = OtpDetector.getAppSignatureHash();
console.log(hashes); // e.g. ["FA+9qCX9VSu"]
```

The hash comes from the package name and the certificate the installed build is signed with. A debug build, a release build signed with your upload key, and the build Google Play delivers (re-signed by Play App Signing) each have their own. Send the hash of the build your users actually install: log it once from a build installed from Play.

---

## iOS

iOS has no API for reading a message, so every function is a no-op there and `getAppSignatureHash()` returns `[]`. Use the system's own one-time-code autofill instead, which offers the code above the keyboard:

```tsx
<TextInput textContentType="oneTimeCode" keyboardType="number-pad" />
```

---

## API

```ts
import OtpDetector from "react-native-otp-detector";
```

### Methods

| Method | What it does |
|---|---|
| `startSmsConsent(options?)` | Starts the User Consent flow. Play services shows its dialog when a matching SMS arrives |
| `startSmsRetriever(options?)` | Starts the Retriever flow. No dialog; needs the app hash in the SMS |
| `getAppSignatureHash()` | Returns `string[]`: the app signature hash of the running build, one per signing certificate. `[]` on iOS |
| `stopListening()` | Stops listening and unregisters the receiver |
| `addListener(event, listener)` | Subscribes to an [event](#events). Returns a subscription with `remove()` |

Both start calls return at once; the result comes later through the events. They throw if there is no activity on screen to attach to.

### Options

| Option | Applies to | Description |
|---|---|---|
| `otpLength` | both | The exact number of digits to look for, e.g. `6`. Ignored when `otpRegex` is set |
| `otpRegex` | both | A regular expression, as a string, that matches the code. The first match is the OTP |
| `senderPhoneNumber` | `startSmsConsent` | Only offer messages from this number. Leave it out to accept any sender |

With neither `otpLength` nor `otpRegex`, the first run of 4 to 8 digits in the message is taken as the code.

### Events

| Event | Payload | When |
|---|---|---|
| `onSmsReceived` | `{ otp: string, message: string }` | A message arrived and a code was found in it |
| `onOtpError` | `{ message: string }` | Play services gave up after five minutes, the user denied consent, the message had no code that matches, or listening could not be started |

### Types

`OtpOptions`, `RetrieverOptions`, `SmsReceivedPayload` and `OtpErrorPayload` are exported for TypeScript.

---

## How listening works

- **One message per start.** After a code (or an error) is delivered the module stops listening. Call the start function again for the next message, for example when the user taps "Resend".
- **Five minutes.** Play services waits up to five minutes for a message, then reports a timeout, which arrives as `onOtpError`.
- **One listener at a time.** Starting again, in either mode, replaces the previous listener.

---

## Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Retriever never fires in production, but works in debug | The SMS carries the hash of a different build. Debug, release and Play-signed builds each have their own | Log `getAppSignatureHash()` from a build installed from Google Play and send that hash |
| Retriever never fires at all | The message is longer than 140 bytes, or the hash is missing or altered by the SMS provider | Keep the message short and check what actually arrives on the phone |
| The consent dialog never appears | The sender is in the user's contacts, the message has no 4 to 10 character code containing a digit, or `senderPhoneNumber` doesn't match | Test with a sender that isn't a saved contact, and without `senderPhoneNumber` first |
| `onOtpError`: "No OTP matching … found in message" | The code doesn't fit the pattern, for example a 4-digit code with `otpLength: 6` | Set `otpLength` to what your backend sends, or pass `otpRegex` |
| The wrong digits come back | Without options the first run of 4 to 8 digits wins, which may be an order number or a year | Pass `otpLength`, or an `otpRegex` that matches only the code |
| `onOtpError`: "SMS retrieval timed out" | No matching message within five minutes | Start listening again when the user requests a new code |
| Nothing happens on "Resend" | Listening stopped after the first message | Call `startSmsConsent` / `startSmsRetriever` again before resending |
| `Cannot find native module 'ReactNativeOtpDetector'` | The app binary was built before the package was installed, or it is running in Expo Go | Make a new development or release build |

---

## Contributing

Issues and pull requests are welcome. The library structure:

```
src/        # TypeScript API: the module binding and its types
android/    # Kotlin implementation (SMS User Consent and SMS Retriever)
ios/        # Swift module with the same functions as no-ops
example/    # Example app (Expo SDK 52), with its native projects committed
```

To work on the library locally:

```sh
yarn install        # also builds build/, which the example imports
cd example
yarn install
# Android
yarn android
# iOS
npx pod-install
yarn ios
```

The Retriever API needs an SMS that carries the example app's hash; the example has a button that shows it. An emulator with Google Play services can receive one from the emulator's extended controls.

---

## FAQ

### Does this need the `READ_SMS` or `RECEIVE_SMS` permission?

No. Both APIs belong to Google Play services, which reads the message and hands it over: one message, after the user's tap, with User Consent; only messages carrying your app's hash with Retriever. The app declares no SMS permission and never sees other messages.

### Does it work on iOS?

The package installs and its functions can be called, but they do nothing: iOS gives apps no access to messages. Set `textContentType="oneTimeCode"` on the input and iOS suggests the code itself. See [iOS](#ios).

### Does it work with Expo and EAS Build?

Yes, in development builds and release builds, with no config plugin. It does not work in Expo Go, which can't load native modules that aren't built into it.

### Can I use both APIs at the same time?

Not in parallel: the module keeps one listener, and starting a mode replaces whichever was listening. A common setup is Retriever where you control the SMS text and User Consent as the fallback where you don't.

### Does it work on devices without Google Play services?

No. Both APIs are part of Play services. Without it, starting fails and the failure arrives as `onOtpError`, so keep the manual entry field working.

### How is the code picked out of the message?

With a regular expression. By default it is the first run of 4 to 8 digits. `otpLength: 6` narrows that to exactly six digits, and `otpRegex` replaces the pattern altogether. The whole message is in the event too, if you'd rather parse it yourself.

---

## Acknowledgements

- [SMS Retriever API](https://developers.google.com/identity/sms-retriever/overview) and [SMS User Consent API](https://developers.google.com/identity/sms-retriever/user-consent/overview) by Google — the Play services APIs this package wraps
- [Expo Modules API](https://docs.expo.dev/modules/overview/) by Expo — the native module layer and autolinking

---

## License

MIT
