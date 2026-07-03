import ReactNativeOtpDetector from "react-native-otp-detector";
import {
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View
} from "react-native";
import InputPhone from "./InputPhone/InputPhone";
import { useEffect, useState } from "react";
import OtpInput from "./InputPhone/OtpInput";

export default function App() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState({ show: false, message: "" });
  const [isOtpSend, setIsOtpSend] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("31212");
  const [otpAutoFillValue, setOtpAutoFillValue] = useState<string>("");
  const [receivedMessage, setReceivedMessage] = useState<string>("");
  const [lastError, setLastError] = useState<string>("");
  const [appHashes, setAppHashes] = useState<string[]>([]);

  useEffect(() => {
    // Listen for the detected OTP (fired by both Consent and Retriever modes).
    const receivedListener = ReactNativeOtpDetector.addListener(
      "onSmsReceived",
      event => {
        console.log("OTP Event Received:", event);
        if (event?.otp) {
          setOtpAutoFillValue(event.otp);
        }
        // The payload also includes the full SMS the OTP was extracted from.
        if (event?.message) {
          setReceivedMessage(event.message);
        }
      }
    );

    // Listen for errors/timeouts/denied consent.
    const errorListener = ReactNativeOtpDetector.addListener(
      "onOtpError",
      event => {
        console.warn("OTP error:", event?.message);
        setLastError(event?.message ?? "Unknown error");
      }
    );

    return () => {
      receivedListener.remove();
      errorListener.remove();
      ReactNativeOtpDetector.stopListening();
    };
  }, []);

  const sendOtp = async () => {
    setIsOtpSend(true);
    //write your api to send otp here
  };

  const showAppHash = () => {
    setAppHashes(ReactNativeOtpDetector.getAppSignatureHash());
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>OTP Detector</Text>

        <Text style={styles.note}>
          {Platform.OS === "android"
            ? "Android: tap a button to start the User Consent or Retriever API, then send yourself an SMS containing a 6-digit code."
            : "iOS: automatic detection is Android-only. The OTP field below uses the native one-time-code autofill (textContentType=\"oneTimeCode\")."}
        </Text>

        <Group name="Functions">
          {isOtpSend ? (
            <OtpInput
              digitCount={6}
              otpAutoFillValue={otpAutoFillValue}
              setValue={value => {
                setOtp(value);
              }}
            />
          ) : (
            <InputPhone
              phone={phone}
              setPhone={value => {
                setPhone(value);
              }}
              error={error}
              onChange={() => {
                setError({
                  show: false,
                  message: ""
                });
              }}
            />
          )}

          {isOtpSend ? (
            <Button
              title="Verify Otp"
              onPress={async () => {
                //
              }}
            />
          ) : (
            <>
              <Button
                title="Send Otp (User Consent API)"
                onPress={async () => {
                  if (Platform.OS === "android") {
                    ReactNativeOtpDetector.startSmsConsent({ otpLength: 6 });
                  }
                  sendOtp();
                }}
              />
              <View style={styles.spacer} />
              <Button
                title="Send Otp (Retriever API)"
                onPress={async () => {
                  if (Platform.OS === "android") {
                    ReactNativeOtpDetector.startSmsRetriever({ otpLength: 6 });
                  }
                  sendOtp();
                }}
              />
            </>
          )}
        </Group>

        <Group name="App signature hash (Retriever)">
          <Button title="Get App Signature Hash" onPress={showAppHash} />
          {appHashes.map(hash => (
            <Text key={hash} style={styles.hash}>
              {hash}
            </Text>
          ))}
        </Group>

        {otpAutoFillValue ? (
          <Group name="Detected OTP">
            <Text style={styles.otpValue}>{otpAutoFillValue}</Text>
            {receivedMessage ? (
              <Text style={styles.message}>from: {receivedMessage}</Text>
            ) : null}
          </Group>
        ) : null}

        {lastError ? (
          <Group name="Last error">
            <Text style={styles.errorText}>{lastError}</Text>
          </Group>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20
  },
  note: {
    fontSize: 14,
    color: "#555",
    marginHorizontal: 20,
    marginBottom: 10
  },
  otpValue: {
    fontSize: 28,
    fontWeight: "600" as const,
    letterSpacing: 4
  },
  message: {
    marginTop: 8,
    fontSize: 13,
    color: "#555"
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20
  },
  spacer: {
    height: 12
  },
  hash: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace"
  },
  errorText: {
    color: "#c00",
    fontSize: 14
  },
  container: {
    flex: 1,
    backgroundColor: "#eee"
  },
  view: {
    flex: 1,
    height: 200
  }
};
