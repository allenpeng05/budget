import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HelpScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newPlanName, setNewPlanName] = useState("Plan");

  const handleRenamePlan = async () => {
    if (!newPlanName.trim()) return;

    try {
      await AsyncStorage.setItem("planName", newPlanName.trim());
      setMenuVisible(false);
      setRenameModalVisible(false);
    } catch (error) {
      console.error("Error saving plan name:", error);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your accounts, transactions, categories, and budget data. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "categories",
                "transactions",
                "accounts",
                "categoryGroups",
                "planName",
              ]);
              setMenuVisible(false);
              Alert.alert(
                "Data Cleared",
                "All data has been cleared. The app will now start fresh."
              );
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Help</ThemedText>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
          >
            <ThemedText style={styles.menuButtonText}>⋯</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Menu Modal */}
        <Modal visible={menuVisible} transparent={true} animationType="fade">
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  setRenameModalVisible(true);
                }}
              >
                <ThemedText style={styles.menuItemText}>Rename Plan</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleClearData}
              >
                <ThemedText style={styles.dangerMenuItemText}>
                  Clear All Data
                </ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Rename Plan Modal */}
        <Modal
          visible={renameModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Rename Plan
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={newPlanName}
                onChangeText={setNewPlanName}
                placeholder="Enter plan name"
                placeholderTextColor="#666"
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setRenameModalVisible(false)}
                >
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleRenamePlan}
                >
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView style={styles.scrollView}>
          {/* Getting Started */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Getting Started</ThemedText>
            <ThemedText style={styles.text}>
              1. Add your accounts (checking, savings, credit cards) with
              current balances{"\n"}
              2. Create budget categories in the Plan tab{"\n"}
              3. Assign money to your categories{"\n"}
              4. Track transactions as you spend
            </ThemedText>
          </ThemedView>

          {/* YNAB Method */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">The YNAB Method</ThemedText>
            <ThemedText style={styles.text}>
              • Give Every Dollar a Job{"\n"}• Embrace Your True Expenses{"\n"}•
              Roll With the Punches{"\n"}• Age Your Money
            </ThemedText>
          </ThemedView>

          {/* Credit Cards */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Credit Card Usage</ThemedText>
            <ThemedText style={styles.text}>
              When you add a credit card account:{"\n"}• A payment category is
              automatically created{"\n"}• When you spend on the card, money
              moves from your spending category to the payment category{"\n"}•
              The payment category shows how much you have available to pay your
              bill
            </ThemedText>
          </ThemedView>

          {/* App Features */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">App Features</ThemedText>
            <ThemedText style={styles.text}>
              • Plan: View and manage your budget categories{"\n"}• Accounts:
              Manage your bank and credit card accounts{"\n"}• Transaction: Add
              new transactions{"\n"}• Reflect: View spending reports and
              insights{"\n"}• Help: This screen
            </ThemedText>
          </ThemedView>

          {/* Tips */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Tips</ThemedText>
            <ThemedText style={styles.text}>
              • Enter transactions as they happen{"\n"}• Review your budget
              regularly{"\n"}• Use the Reflect tab to understand your spending
              patterns{"\n"}• Don't worry about being perfect - roll with the
              punches!
            </ThemedText>
          </ThemedView>

          {/* About */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">About</ThemedText>
            <ThemedText style={styles.text}>
              This is a personal budgeting app inspired by YNAB (You Need A
              Budget).{"\n"}
              All data is stored locally on your device.{"\n"}
              No bank linking, no cloud sync, no subscription fees.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  text: {
    lineHeight: 20,
    marginTop: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  menuItemText: {
    color: "#fff",
    fontSize: 18,
  },
  dangerMenuItemText: {
    color: "#FF6B6B",
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: 15,
  },
  textInput: {
    width: "100%",
    height: 50,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#666",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  saveButton: {
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  saveButtonText: {
    color: "#4CAF50",
    fontSize: 18,
  },
});
