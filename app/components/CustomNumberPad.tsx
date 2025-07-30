import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CustomNumberPad({
  onPress,
  onBackspace,
  onAdd,
  onSubtract,
  onEquals,
  onDone,
}: {
  onPress: (digit: string) => void;
  onBackspace: () => void;
  onAdd: () => void;
  onSubtract: () => void;
  onEquals: () => void;
  onDone: () => void;
}) {
  return (
    <View style={styles.padContainer}>
      <View style={styles.row}>
        <PadButton label="7" onPress={() => onPress("7")} />
        <PadButton label="8" onPress={() => onPress("8")} />
        <PadButton label="9" onPress={() => onPress("9")} />
        <PadButton label="-" onPress={onSubtract} />
      </View>
      <View style={styles.row}>
        <PadButton label="4" onPress={() => onPress("4")} />
        <PadButton label="5" onPress={() => onPress("5")} />
        <PadButton label="6" onPress={() => onPress("6")} />
        <PadButton label="+" onPress={onAdd} />
      </View>
      <View style={styles.row}>
        <PadButton label="1" onPress={() => onPress("1")} />
        <PadButton label="2" onPress={() => onPress("2")} />
        <PadButton label="3" onPress={() => onPress("3")} />
        <PadButton label="=" onPress={onEquals} />
      </View>
      <View style={styles.row}>
        <PadButton label="0" onPress={() => onPress("0")} style={{ flex: 3 }} />
        <PadButton
          label={<Text style={{ fontSize: 22 }}>⌫</Text>}
          onPress={onBackspace}
        />
        <PadButton
          label={<Text style={styles.doneText}>done</Text>}
          onPress={onDone}
          style={styles.doneButton}
        />
      </View>
    </View>
  );
}

function PadButton({
  label,
  onPress,
  style,
}: {
  label: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  padContainer: {
    backgroundColor: "#23233a",
    paddingTop: 4, // Reduced
    paddingBottom: 12, // Reduced
    paddingHorizontal: 4, // Reduced
    borderTopLeftRadius: 20, // Slightly smaller
    borderTopRightRadius: 20,
    width: "100%",
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4, // Reduced
  },
  button: {
    flex: 1,
    marginHorizontal: 2, // Reduced
    backgroundColor: "#292a3a",
    borderRadius: 10, // Slightly smaller
    paddingVertical: 12, // Reduced
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 20, // Slightly smaller
    fontWeight: "bold",
  },
  doneButton: {
    backgroundColor: "#7a7aff",
    flex: 1.5,
  },
  doneText: {
    color: "#fff",
    fontSize: 16, // Slightly smaller
    fontWeight: "bold",
  },
});
