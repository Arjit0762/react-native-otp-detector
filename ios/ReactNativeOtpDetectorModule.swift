import ExpoModulesCore

public class ReactNativeOtpDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeOtpDetector")

    Function("startSmsConsent") {
      let message = "ReactNativeOtpDetector: startSmsConsent is not available on iOS."
      print(message)

      // Emit an event for consistency
      self.sendEvent("onSmsReceived", ["otp": "Not available on iOS"])

      return message
    }

    Events("onSmsReceived")
  }
}
