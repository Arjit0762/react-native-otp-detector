import React, { useState, useRef, useEffect } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  TextInputKeyPressEventData,
  Dimensions
} from "react-native";

const { width: widthsize, height: heightsize } = Dimensions.get("window");

interface OtpInputProps {
  digitCount: number;
  otpAutoFillValue: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  inputProps?: TextInputProps;
}

const OtpInput: React.FC<OtpInputProps> = ({
  digitCount,
  otpAutoFillValue,
  setValue,
  inputProps
}) => {
  const [otpValues, setOtpValues] = useState<string[]>(
    Array(digitCount).fill("")
  );
  const refs = useRef<TextInput[]>(Array(digitCount).fill(null));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (otpAutoFillValue && otpAutoFillValue.length === digitCount) {
      setOtpValues(otpAutoFillValue.split("")); // Convert "12345" → ["1", "2", "3", "4", "5"]
    }
  }, [otpAutoFillValue, digitCount]);

  const handleChangeText = (text: string, index: number) => {
    const sanitizedText = text.replace(/[^0-9]/g, ""); // Remove non-numeric characters

    if (sanitizedText.length > 1) {
      // Handle paste
      const newOtpValues = [...otpValues];
      for (let i = 0; i < sanitizedText.length; i++) {
        if (index + i < digitCount) {
          newOtpValues[index + i] = sanitizedText[i];
        }
      }
      setOtpValues(newOtpValues);
      setValue(newOtpValues.join(""));

      // Focus the next empty input if available
      const nextIndex =
        index + sanitizedText.length < digitCount
          ? index + sanitizedText.length
          : digitCount - 1;
      refs.current[nextIndex]?.focus();
    } else {
      // Handle regular typing
      const newOtpValues = [...otpValues];
      newOtpValues[index] = sanitizedText;
      setOtpValues(newOtpValues);
      setValue(newOtpValues.join(""));

      // Move focus to the next input field if available
      if (sanitizedText && index < digitCount - 1) {
        refs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (
    e: React.BaseSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otpValues[index] === "") {
        // If the current textbox is empty, clear the previous textbox and move focus there
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);

        if (index > 0 && refs.current[index - 1]) {
          refs.current[index - 1].focus();
        }
      } else {
        // If the current textbox is not empty, clear only the current textbox
        const newOtpValues = [...otpValues];
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  return (
    <View style={styles.container}>
      {otpValues.map((value, index) => (
        <TextInput
          key={index}
          style={[styles.cell, focusedIndex === index && styles.focusCell]}
          maxLength={digitCount - index} // Allow maxLength equal to the remaining digits
          keyboardType="numeric"
          value={value}
          onChangeText={text => handleChangeText(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          ref={ref => (refs.current[index] = ref as TextInput)}
          autoComplete="sms-otp"
          {...inputProps}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderBottomWidth: 2,
    borderColor: "grey",
    borderRadius: 1,
    color: "black",
    fontSize: (widthsize * 5.5) / 100,
    height: (heightsize * 5) / 100,
    marginRight: (widthsize * 3) / 100,
    textAlign: "center",
    width: (widthsize * 8) / 100
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  focusCell: {
    borderColor: "black"
  }
});

export default OtpInput;
