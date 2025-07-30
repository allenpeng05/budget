import { Account } from "@/components/CategoryModel";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBudgetStorage } from "@/hooks/useBudgetStorage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function AccountsScreen() {
  const { accounts, addAccount, transactions, loading, refreshData } =
    useBudgetStorage();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [accountType, setAccountType] = useState<
    "checking" | "savings" | "credit-card"
  >("checking");
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    cash: true,
    credit: true,
  });
  const router = useRouter();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [])
  );

  const handleAddAccount = async () => {
    if (!name || isNaN(Number(balance))) return;

    const newAccount: Account = {
      id: Date.now().toString(),
      name,
      balance:
        accountType === "credit-card"
          ? -Math.abs(parseFloat(balance))
          : parseFloat(balance),
      type: accountType,
    };

    await addAccount(newAccount);
    setName("");
    setBalance("");
    setAccountType("checking");
    setModalVisible(false);
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "checking":
        return "Checking";
      case "savings":
        return "Savings";
      case "credit-card":
        return "Credit Card";
      default:
        return type;
    }
  };

  // Calculate working balance for an account based on transactions
  const calculateWorkingBalance = (account: Account) => {
    const accountTransactions = transactions.filter(
      (tx) => tx.accountId === account.id
    );
    const transactionTotal = accountTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    return account.balance + transactionTotal;
  };

  const formatBalance = (balance: number, type: string) => {
    const absBalance = Math.abs(balance);
    const sign = type === "credit-card" ? (balance < 0 ? "-" : "+") : "";
    return `${sign}$${absBalance.toFixed(2)}`;
  };

  // Group accounts by type
  const cashAccounts = accounts.filter(
    (acc) => acc.type === "checking" || acc.type === "savings"
  );
  const creditAccounts = accounts.filter((acc) => acc.type === "credit-card");

  // Calculate totals
  const cashTotal = cashAccounts.reduce(
    (sum, acc) => sum + calculateWorkingBalance(acc),
    0
  );
  const creditTotal = creditAccounts.reduce(
    (sum, acc) => sum + calculateWorkingBalance(acc),
    0
  );

  const toggleSection = (section: "cash" | "credit") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderAccountItem = (account: Account) => (
    <TouchableOpacity
      key={account.id}
      onPress={() =>
        router.push({
          pathname: "/accounts/[id]",
          params: { id: account.id },
        })
      }
    >
      <ThemedView style={styles.accountItem}>
        <View>
          <ThemedText type="subtitle">{account.name}</ThemedText>
        </View>
        <ThemedText
          type="defaultSemiBold"
          style={[
            styles.balance,
            (() => {
              const workingBalance = calculateWorkingBalance(account);
              return account.type === "credit-card" && workingBalance < 0
                ? styles.negativeBalance
                : styles.positiveBalance;
            })(),
          ]}
        >
          {formatBalance(calculateWorkingBalance(account), account.type)}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  const renderSection = (
    title: string,
    accounts: Account[],
    total: number,
    sectionKey: "cash" | "credit"
  ) => {
    if (accounts.length === 0) return null;

    return (
      <View key={sectionKey} style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.expandIcon}>
            {expandedSections[sectionKey] ? "▼" : "▶"}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {title}
          </ThemedText>
          <ThemedText
            style={[
              styles.sectionTotal,
              sectionKey === "credit" && total < 0 && styles.negativeBalance,
            ]}
          >
            {formatBalance(
              total,
              sectionKey === "credit" ? "credit-card" : "checking"
            )}
          </ThemedText>
        </TouchableOpacity>

        {expandedSections[sectionKey] && (
          <View style={styles.sectionContent}>
            {accounts.map(renderAccountItem)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Accounts</ThemedText>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton}>
              <ThemedText style={{ fontSize: 20 }}>⋯</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.addButton}
            >
              <ThemedText style={{ fontSize: 28 }}>＋</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : (
          <ScrollView style={styles.scrollView}>
            {/* All Transactions Button */}
            <TouchableOpacity style={styles.allTransactionsButton}>
              <ThemedText style={styles.allTransactionsText}>
                All transactions
              </ThemedText>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </TouchableOpacity>

            {/* Cash Section */}
            {renderSection("Cash", cashAccounts, cashTotal, "cash")}

            {/* Credit Section */}
            {renderSection("Credit", creditAccounts, creditTotal, "credit")}

            {/* Add Account Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.addAccountButton}
            >
              <ThemedText style={styles.addAccountButtonText}>＋</ThemedText>
              <ThemedText style={styles.addAccountButtonLabel}>
                Add Account
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Rest of the modal code remains the same */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Add Account
                </ThemedText>
                <TextInput
                  placeholder="Account Name"
                  placeholderTextColor="#888"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  selectionColor="#222"
                  autoFocus
                />
                <View style={styles.pickerLabelRow}>
                  <ThemedText style={styles.pickerLabel}>
                    Account Type
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.dropdownInput}
                  onPress={() => setTypeDropdownVisible(true)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.dropdownText,
                      !accountType && styles.dropdownPlaceholder,
                    ]}
                  >
                    {accountType === "checking"
                      ? "Checking"
                      : accountType === "savings"
                      ? "Savings"
                      : accountType === "credit-card"
                      ? "Credit Card"
                      : "Select Account Type"}
                  </ThemedText>
                </TouchableOpacity>
                <Modal
                  visible={typeDropdownVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setTypeDropdownVisible(false)}
                >
                  <TouchableWithoutFeedback
                    onPress={() => setTypeDropdownVisible(false)}
                  >
                    <View style={styles.dropdownOverlay}>
                      <View style={styles.dropdownModal}>
                        {["checking", "savings", "credit-card"].map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setAccountType(
                                type as "checking" | "savings" | "credit-card"
                              );
                              setTypeDropdownVisible(false);
                            }}
                          >
                            <ThemedText style={styles.dropdownOptionText}>
                              {type === "checking"
                                ? "Checking"
                                : type === "savings"
                                ? "Savings"
                                : "Credit Card"}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
                <TextInput
                  placeholder={
                    accountType === "credit-card"
                      ? "Current Balance Owed"
                      : "Starting Balance"
                  }
                  placeholderTextColor="#888"
                  value={balance}
                  onChangeText={setBalance}
                  style={styles.input}
                  keyboardType="numeric"
                  selectionColor="#222"
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      setName("");
                      setBalance("");
                      setAccountType("checking");
                    }}
                  >
                    <ThemedText style={styles.cancelButtonText}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddAccount}
                  >
                    <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#222",
    borderRadius: 8,
    marginBottom: 8,
  },
  balance: {
    fontSize: 16,
    fontWeight: "600",
  },
  positiveBalance: {
    color: "#4CAF50",
  },
  negativeBalance: {
    color: "#ff6b6b",
  },
  listContent: {
    paddingBottom: 32,
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
    alignItems: "stretch",
  },
  modalTitle: {
    color: "#222",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
    color: "#222",
    fontSize: 16,
  },
  pickerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pickerLabel: {
    fontWeight: "600",
    color: "#222",
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 8, // Reduced margin for tighter alignment
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  picker: {
    height: 44, // Standard input height
    color: "#222",
    backgroundColor: "#fff",
    paddingHorizontal: 8, // Add padding for touch area
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  dropdownInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    justifyContent: "center",
  },
  dropdownText: {
    color: "#222",
    fontSize: 16,
  },
  dropdownPlaceholder: {
    color: "#888",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    width: 250,
    alignItems: "stretch",
    elevation: 4,
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#222",
  },
  // New styles for collapsible sections
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  sectionTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  expandIcon: {
    fontSize: 16,
    color: "#888",
  },
  sectionContent: {
    marginTop: 8,
  },
  allTransactionsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#333",
    borderRadius: 8,
    marginBottom: 12,
  },
  allTransactionsText: {
    color: "#fff",
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
    color: "#888",
  },
  addAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    marginTop: 12,
  },
  addAccountButtonText: {
    fontSize: 20,
    color: "#fff",
    marginRight: 8,
  },
  addAccountButtonLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#888",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
