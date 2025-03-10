import ReactNativeOtpDetector from "react-native-otp-detector";
import { Button, SafeAreaView, ScrollView, Text, View } from "react-native";
import InputPhone from "./InputPhone/InputPhone";
import { useEffect, useState } from "react";
import OtpInput from "./InputPhone/OtpInput";

export default function App() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState({ show: false, message: "" });
  const [isOtpSend, setIsOtpSend] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("31212");
  const [otpAutoFillValue, setOtpAutoFillValue] = useState<string>("");

  useEffect(() => {
    // Listen for OTP event
    const eventListener = ReactNativeOtpDetector.addListener(
      "onSmsReceived",
      event => {
        console.log("OTP Event Received:", event);
        if (event?.otp) {
          console.log("otp", event?.otp);
          setOtpAutoFillValue(event?.otp);
        }
      }
    );

    return () => {
      eventListener.remove(); // Clean up listener on unmount
    };
  }, []);

  const sendOtp = async () => {
    //write your api to send otp here

    setIsOtpSend(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>User Consent API</Text>

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
            <Button
              title="Send Otp"
              onPress={async () => {
                console.log(await ReactNativeOtpDetector.startSmsConsent());
                sendOtp();
              }}
            />
          )}
        </Group>
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
  container: {
    flex: 1,
    backgroundColor: "#eee"
  },
  view: {
    flex: 1,
    height: 200
  }
};
