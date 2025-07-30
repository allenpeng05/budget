import { Transaction } from "@/components/CategoryModel";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBudgetStorage } from "@/hooks/useBudgetStorage";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import CustomNumberPad from "../components/CustomNumberPad";

export default function TransactionScreen() {
  const router = useRouter();
  const {
    accounts,
    categories,
    transactions,
    setTransactions,
    setCategories,
    addTransaction: addTransactionToStorage,
    loading,
  } = useBudgetStorage();
  const [modalVisible, setModalVisible] = useState(false); // Open modal by default
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [transactionType, setTransactionType] = useState<"outflow" | "inflow">(
    "outflow"
  );
  const [date, setDate] = useState(new Date());
  const [payeeModal, setPayeeModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [dateModal, setDateModal] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(""); // For number pad input
  const [padMemory, setPadMemory] = useState<number | null>(null);
  const [padOperator, setPadOperator] = useState<null | "+" | "-">();

  // Show modal every time the tab is focused
  useFocusEffect(
    React.useCallback(() => {
      setModalVisible(true);
      setPendingAmount("");
      setAmount("0.00");
      setPadMemory(null);
      setPadOperator(undefined);
    }, [])
  );

  // Auto-decimal logic: treat input as cents
  const getFormattedAmount = (raw: string) => {
    if (!raw) return "0.00";
    let cents = raw.replace(/^0+/, "");
    if (!cents) cents = "0";
    while (cents.length < 3) cents = "0" + cents;
    const dollars = cents.slice(0, -2);
    const centsPart = cents.slice(-2);
    return `${parseInt(dollars, 10)}.${centsPart}`;
  };

  // Handlers for number pad
  const handlePadPress = (digit: string) => {
    if (pendingAmount.length > 8) return; // Limit input
    setPendingAmount((prev) => (prev === "0" ? digit : prev + digit));
    setAmount(
      getFormattedAmount(pendingAmount === "0" ? digit : pendingAmount + digit)
    );
  };
  const handlePadBackspace = () => {
    setPendingAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : ""));
    setAmount(
      getFormattedAmount(
        pendingAmount.length > 1 ? pendingAmount.slice(0, -1) : ""
      )
    );
  };
  const handlePadDone = () => {
    setAmountFocused(false);
  };
  const handlePadAdd = () => {
    setPadMemory(parseFloat(amount));
    setPadOperator("+");
    setPendingAmount("");
    setAmount("0.00");
  };
  const handlePadSubtract = () => {
    setPadMemory(parseFloat(amount));
    setPadOperator("-");
    setPendingAmount("");
    setAmount("0.00");
  };
  const handlePadEquals = () => {
    if (padMemory !== null && padOperator) {
      const current = parseFloat(amount);
      let result =
        padOperator === "+" ? padMemory + current : padMemory - current;
      setAmount(result.toFixed(2));
      setPendingAmount(String(Math.round(result * 100)));
      setPadMemory(null);
      setPadOperator(undefined);
    }
    // Do not hide the pad
  };

  const addTransaction = async () => {
    if (
      !payee ||
      !amount ||
      !selectedCategory ||
      !selectedAccount ||
      isNaN(Number(amount))
    )
      return;

    const transactionAmount =
      transactionType === "outflow"
        ? -Math.abs(parseFloat(amount))
        : Math.abs(parseFloat(amount));

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      payee,
      amount: transactionAmount,
      categoryId: selectedCategory,
      accountId: selectedAccount,
      date: new Date().toISOString(),
    };

    // Use the storage hook's addTransaction function which handles all updates
    await addTransactionToStorage(newTransaction);

    setPayee("");
    setAmount("");
    setSelectedCategory("");
    setSelectedAccount("");
    setTransactionType("outflow");
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setTimeout(() => {
      router.replace("/accounts");
    }, 200); // Give modal time to close
  };

  const handleAddTransaction = async () => {
    await addTransaction();
    setModalVisible(false);
    setTimeout(() => {
      router.replace("/accounts");
    }, 200);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.name : "Unknown";
  };

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "+";
    return `${sign}$${absAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper for formatted amount
  const formattedAmount = () => {
    const amt = parseFloat(amount) || 0;
    const sign = transactionType === "outflow" ? "-" : "";
    return `${sign}$${Math.abs(amt).toFixed(2)}`;
  };

  // Helper to check if all fields are filled
  function canSaveTransaction() {
    return (
      parseFloat(amount) > 0 &&
      payee.trim() !== "" &&
      selectedCategory.trim() !== "" &&
      selectedAccount.trim() !== "" &&
      date instanceof Date &&
      !isNaN(date.getTime())
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
      <ThemedView style={styles.container}>
        <Modal visible={modalVisible} animationType="slide" transparent={false}>
          <SafeAreaView
            style={{
              flex: 1,
              backgroundColor: "#292a3a",
              padding: 0,
              margin: 0,
            }}
          >
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <View
                style={[
                  styles.fullScreenModalContent,
                  { flex: 1, flexDirection: "column" },
                ]}
              >
                <View style={{ flex: 1, justifyContent: "flex-start" }}>
                  <View style={styles.modalHeaderRow}>
                    <TouchableOpacity onPress={handleCancel}>
                      <ThemedText style={styles.cancelButton}>
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.modalTitle}>
                      Add Transaction
                    </ThemedText>
                    {/* Removed top right Done button */}
                  </View>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        transactionType === "outflow" && styles.toggleSelected,
                      ]}
                      onPress={() => setTransactionType("outflow")}
                    >
                      <ThemedText
                        style={[
                          styles.toggleText,
                          transactionType === "outflow" &&
                            styles.toggleSelectedText,
                        ]}
                      >
                        Outflow
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        transactionType === "inflow" && styles.toggleSelected,
                      ]}
                      onPress={() => setTransactionType("inflow")}
                    >
                      <ThemedText
                        style={[
                          styles.toggleText,
                          transactionType === "inflow" &&
                            styles.toggleSelectedText,
                        ]}
                      >
                        Inflow
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAmountFocused(true)}
                    activeOpacity={0.8}
                  >
                    <TextInput
                      style={[
                        styles.amountInput,
                        transactionType === "outflow"
                          ? styles.amountNegative
                          : styles.amountPositive,
                      ]}
                      value={
                        (transactionType === "outflow" ? "-" : "") +
                        "$" +
                        amount
                      }
                      editable={false}
                      pointerEvents="none"
                    />
                  </TouchableOpacity>
                  <View style={styles.rowListCondensed}>
                    <TouchableOpacity
                      style={styles.rowItemCondensed}
                      onPress={() => setPayeeModal(true)}
                    >
                      <Ionicons
                        name="swap-horizontal"
                        size={18}
                        color="#7a7aff"
                        style={styles.rowIcon}
                      />
                      <View>
                        <ThemedText style={styles.rowLabelCondensed}>
                          Payee
                        </ThemedText>
                        <ThemedText style={styles.rowValueCondensed}>
                          {payee || "Choose Payee"}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rowItemCondensed}
                      onPress={() => setCategoryModal(true)}
                    >
                      <MaterialIcons
                        name="category"
                        size={18}
                        color="#7a7aff"
                        style={styles.rowIcon}
                      />
                      <View>
                        <ThemedText style={styles.rowLabelCondensed}>
                          Category
                        </ThemedText>
                        <ThemedText style={styles.rowValueCondensed}>
                          {getCategoryName(selectedCategory) ||
                            "Choose Category"}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rowItemCondensed}
                      onPress={() => setAccountModal(true)}
                    >
                      <FontAwesome5
                        name="university"
                        size={18}
                        color="#7a7aff"
                        style={styles.rowIcon}
                      />
                      <View>
                        <ThemedText style={styles.rowLabelCondensed}>
                          Account
                        </ThemedText>
                        <ThemedText style={styles.rowValueCondensed}>
                          {getAccountName(selectedAccount) || "Choose Account"}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rowItemCondensed}
                      onPress={() => setDateModal(true)}
                    >
                      <Ionicons
                        name="calendar"
                        size={18}
                        color="#7a7aff"
                        style={styles.rowIcon}
                      />
                      <View>
                        <ThemedText style={styles.rowLabelCondensed}>
                          Date
                        </ThemedText>
                        <ThemedText style={styles.rowValueCondensed}>
                          {formatDate(date.toISOString())}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Render modals at the root so they are not hidden */}
                <Modal visible={payeeModal} transparent animationType="fade">
                  <TouchableWithoutFeedback
                    onPress={() => setPayeeModal(false)}
                  >
                    <View style={styles.pickerOverlay}>
                      <View style={styles.pickerModal}>
                        <TextInput
                          style={styles.pickerInput}
                          value={payee}
                          onChangeText={setPayee}
                          placeholder="Enter Payee"
                          placeholderTextColor="#888"
                          autoFocus
                        />
                        <TouchableOpacity onPress={() => setPayeeModal(false)}>
                          <ThemedText style={styles.pickerOptionText}>
                            Done
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
                <Modal visible={categoryModal} transparent animationType="fade">
                  <TouchableWithoutFeedback
                    onPress={() => setCategoryModal(false)}
                  >
                    <View style={styles.pickerOverlay}>
                      <View style={styles.pickerModal}>
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            style={styles.pickerOption}
                            onPress={() => {
                              setSelectedCategory(cat.id);
                              setCategoryModal(false);
                            }}
                          >
                            <ThemedText style={styles.pickerOptionText}>
                              {cat.name}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
                <Modal visible={accountModal} transparent animationType="fade">
                  <TouchableWithoutFeedback
                    onPress={() => setAccountModal(false)}
                  >
                    <View style={styles.pickerOverlay}>
                      <View style={styles.pickerModal}>
                        {accounts.map((acc) => (
                          <TouchableOpacity
                            key={acc.id}
                            style={styles.pickerOption}
                            onPress={() => {
                              setSelectedAccount(acc.id);
                              setAccountModal(false);
                            }}
                          >
                            <ThemedText style={styles.pickerOptionText}>
                              {acc.name}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
                <Modal visible={dateModal} transparent animationType="fade">
                  <TouchableWithoutFeedback onPress={() => setDateModal(false)}>
                    <View style={styles.pickerOverlay}>
                      <View style={styles.pickerModal}>
                        <TextInput
                          style={styles.pickerInput}
                          value={formatDate(date.toISOString())}
                          editable={false}
                        />
                        <TouchableOpacity onPress={() => setDateModal(false)}>
                          <ThemedText style={styles.pickerOptionText}>
                            Done
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
                {amountFocused && (
                  <View style={styles.numberPadContainer}>
                    <CustomNumberPad
                      onPress={handlePadPress}
                      onBackspace={handlePadBackspace}
                      onAdd={handlePadAdd}
                      onSubtract={handlePadSubtract}
                      onEquals={handlePadEquals}
                      onDone={handlePadDone}
                    />
                  </View>
                )}
                {/* Save button, only visible when number pad is not open */}
                {!amountFocused && (
                  <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        !canSaveTransaction() && styles.saveButtonDisabled,
                      ]}
                      onPress={handleAddTransaction}
                      disabled={!canSaveTransaction()}
                    >
                      <ThemedText style={styles.saveButtonText}>
                        Save
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#18191A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  addButton: {
    padding: 8,
    marginRight: 8,
  },
  transactionList: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    marginTop: 40,
  },
  transactionItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "600",
  },
  positiveAmount: {
    color: "#4CAF50",
  },
  negativeAmount: {
    color: "#F44336",
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailText: {
    color: "#888",
    fontSize: 14,
  },
  dateText: {
    color: "#888",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 8,
    width: "85%",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    alignItems: "center",
  },
  selectedTypeButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  typeButtonText: {
    color: "#333",
  },
  selectedTypeButtonText: {
    color: "#fff",
  },
  pickerContainer: {
    marginBottom: 8,
  },
  pickerLabel: {
    marginBottom: 8,
    fontWeight: "600",
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionModal: {
    backgroundColor: "#292a3a",
    borderRadius: 24,
    padding: 24,
    width: "92%",
    maxWidth: 420,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
  cancelButton: {
    color: "#aaa",
    fontSize: 18,
  },
  doneButton: {
    color: "#7a7aff",
    fontWeight: "bold",
    fontSize: 18,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#23233a",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  toggleSelected: {
    backgroundColor: "#35356b",
  },
  toggleText: {
    color: "#aaa",
    fontWeight: "bold",
    fontSize: 16,
  },
  toggleSelectedText: {
    color: "#fff",
  },
  amountInput: {
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 12,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  amountNegative: {
    color: "#F44336",
  },
  amountPositive: {
    color: "#4CAF50",
  },
  rowList: {
    marginTop: 8,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#35356b",
  },
  rowIcon: {
    marginRight: 16,
  },
  rowLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  rowValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModal: {
    backgroundColor: "#292a3a",
    borderRadius: 16,
    padding: 20,
    width: 320,
    maxWidth: "90%",
    alignItems: "stretch",
  },
  pickerInput: {
    borderWidth: 1,
    borderColor: "#35356b",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#23233a",
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  pickerOptionText: {
    color: "#fff",
    fontSize: 16,
  },
  fullScreenModalContent: {
    flex: 1,
    backgroundColor: "#292a3a",
    paddingHorizontal: 24, // Add horizontal padding
    paddingTop: 32, // Add top padding
    paddingBottom: 0,
    width: "100%",
    justifyContent: "flex-start",
  },
  numberPadContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  rowListCondensed: {
    marginTop: 4,
    gap: 4,
  },
  rowItemCondensed: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#35356b",
  },
  rowLabelCondensed: {
    color: "#aaa",
    fontSize: 13,
  },
  rowValueCondensed: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  saveButtonContainer: {
    position: "absolute",
    right: 24,
    bottom: 24,
    zIndex: 10,
  },
  saveButton: {
    backgroundColor: "#7a7aff",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: "#444",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
