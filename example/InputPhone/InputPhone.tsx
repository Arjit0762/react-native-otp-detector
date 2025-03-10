/* eslint-disable react-native/no-inline-styles */

import React, { useState } from "react";
import { View, StyleSheet, TextInput, Text, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width: widthsize, height: heightsize } = Dimensions.get("window");

interface InputPhoneProps {
  phone: string;
  setPhone: (value: any) => void;
  error?: ErrorJsonType;
  onChange?: (text: string) => void;
}

interface ErrorJsonType {
  show: boolean;
  message: string;
}
interface CounrtyCodeJsonType {
  flags: {
    png: string;
  };
  name: {
    common: string;
  };
  idd: {
    root: string;
    suffixes: any;
  };
}

const InputPhone: React.FC<InputPhoneProps> = ({
  phone,
  setPhone,
  error = { show: false, message: "" },
  onChange
}) => {
  const [isDropdownPressed, setIsDropdownPressed] = useState(false);
  const [isTypeActive, setIsTypeActive] = useState(false);

  //   const country_code_value = data.idd.root + data.idd.suffixes[0]
  //  }
  const handleChangeText = (text: any) => {
    // console.log(text);
    if (text.length > 1) setPhone(text.replace(/[^0-9]/g, ""));
    else setPhone(text.replace(/[^1-9]/g, ""));

    if (onChange) {
      onChange(text);
    }
  };

  return (
    <View style={{ flexDirection: "column" }}>
      <View
        testID="phone-login"
        style={[
          styles.textBoxContainer,
          isTypeActive
            ? {
                borderColor: "black",
                borderWidth: 1.5
              }
            : {},
          error.show ? { borderColor: "red" } : {}
        ]} // Conditional border color change}
      >
        <TextInput
          style={styles.phoneNumberText}
          placeholder="Enter number"
          value={phone.toString()}
          onChangeText={handleChangeText}
          maxLength={10}
          keyboardType="phone-pad"
          onFocus={() => {
            setIsTypeActive(true);
          }}
          onBlur={() => {
            setIsTypeActive(false);
          }}
        />
      </View>

      {error && error.show ? (
        <View style={styles.errorWithMessageContainer}>
          <MaterialIcons name="error" size={14} color="red" />
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : (
        <View style={styles.errorEmptyContainer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  code: {
    flex: 1,
    fontSize: (widthsize * 3.5) / 100,
    textAlign: "right"
  },
  countryCodeText: {
    fontSize: (widthsize * 4) / 100
  },
  errorEmptyContainer: {
    height: (heightsize * 2.4) / 100
  },
  errorText: {
    fontSize: (widthsize * 2.5) / 100,
    marginLeft: (widthsize * 1) / 100
  },
  errorWithMessageContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: (heightsize * 0.5) / 100
  },
  flag: {
    alignItems: "center",
    height: (heightsize * 3) / 100,
    marginRight: (widthsize * 2.5) / 100,
    width: (widthsize * 9) / 100
  },
  flagIcon: {
    alignItems: "center",
    height: (heightsize * 3) / 100,
    marginRight: (widthsize * 2) / 100,
    width: (widthsize * 9) / 100
  },
  inputTextContainerError: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "red",
    borderRadius: 8,
    borderWidth: 1,
    display: "flex",
    flexDirection: "row",
    height: (heightsize * 5.5) / 100,
    paddingHorizontal: (widthsize * 3) / 100
  },
  phoneNumberText: {
    color: "black",
    fontSize: (widthsize * 4.5) / 100,
    width: (widthsize * 60) / 100
  },
  text: {
    color: "black",
    flex: 1,
    fontSize: (widthsize * 3.5) / 100
  },
  textBoxContainer: {
    alignItems: "center",
    backgroundColor: "whit",
    borderColor: "grey",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: (heightsize * 5.5) / 100,
    paddingHorizontal: (widthsize * 3) / 100,
    width: "100%"
  }
});

export default InputPhone;
