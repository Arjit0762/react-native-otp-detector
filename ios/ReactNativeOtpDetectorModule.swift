import ExpoModulesCore

// Automatic SMS/OTP detection (SMS User Consent API & SMS Retriever API) is an
// Android-only capability provided by Google Play services. iOS has no equivalent
// programmatic API. On iOS, use the system's built-in one-time-code autofill by
// setting `textContentType="oneTimeCode"` on your OTP TextInput — iOS will surface
// the code from Messages as a QuickType keyboard suggestion automatically.
//
// These functions are implemented as safe no-ops so the same JS code runs on both
// platforms without crashing. Guard with Platform.OS === "android" if you only want
// to call them on Android.
public class ReactNativeOtpDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeOtpDetector")

    Events("onSmsReceived", "onOtpError")

    Function("startSmsConsent") { (_ options: [String: Any]?) -> Void in
      // No-op on iOS — see file header.
    }

    Function("startSmsRetriever") { (_ options: [String: Any]?) -> Void in
      // No-op on iOS — see file header.
    }

    Function("getAppSignatureHash") { () -> [String] in
      // The app signature hash only applies to the Android SMS Retriever API.
      return []
    }

    Function("stopListening") {
      // No-op on iOS.
    }
  }
}
