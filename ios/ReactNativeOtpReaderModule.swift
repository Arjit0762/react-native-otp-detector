import ExpoModulesCore

public class ReactNativeOtpReaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeOtpReader")

    Function("startSmsConsent") { (callback: (String) -> Void) in
      let message = "ReactNativeOtpReader: startSmsConsent is not available on iOS."
      print(message)
      callback(message) // Send the message back to JavaScript

      // Emit an event for consistency
      self.sendEvent("onSmsReceived", ["otp": "Not available on iOS"])
    }

    Events("onSmsReceived")
  }
}
