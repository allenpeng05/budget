import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBudgetStorage } from "@/hooks/useBudgetStorage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
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

export default function AccountDetailsScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { id } = useLocalSearchParams();
  const router = useRouter();
  const {
    accounts,
    transactions,
    categories,
    setAccounts,
    setTransactions,
    setCategories,
    addTransaction,
    refreshData,
  } = useBudgetStorage();
  const account = accounts.find((acc) => acc.id === id);
  const accountTransactions = transactions
    .filter((tx) => tx.accountId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // State for menus and modals
  const [menuVisible, setMenuVisible] = useState(false);
  const [reconcileModalVisible, setReconcileModalVisible] = useState(false);
  const [reconcileStep, setReconcileStep] = useState<
    "initial" | "enter-balance"
  >("initial");
  const [reconcileBalance, setReconcileBalance] = useState("");
  const [reconcileBalanceNegative, setReconcileBalanceNegative] =
    useState(false);

  // Calculate working balance for this account
  const calculateWorkingBalance = (account: any) => {
    const accountTransactions = transactions.filter(
      (tx) => tx.accountId === account.id
    );
    const transactionTotal = accountTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    return account.balance + transactionTotal;
  };

  // Calculate cleared balance (all transactions)
  const calculateClearedBalance = (account: any) => {
    const accountTransactions = transactions.filter(
      (tx) => tx.accountId === account.id
    );
    const transactionTotal = accountTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    return account.balance + transactionTotal;
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete "${account?.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Remove account
            const updatedAccounts = accounts.filter((acc) => acc.id !== id);
            await setAccounts(updatedAccounts);

            // Remove all transactions for this account
            const updatedTransactions = transactions.filter(
              (tx) => tx.accountId !== id
            );
            await setTransactions(updatedTransactions);

            // If it's a credit card, also remove the payment category
            if (account?.type === "credit-card") {
              const updatedCategories = categories.filter(
                (cat) => cat.id !== `cc-payment-${id}`
              );
              await setCategories(updatedCategories);
            }

            router.back();
          },
        },
      ]
    );
    setMenuVisible(false);
  };

  const handleReconcile = () => {
    setMenuVisible(false);
    setReconcileModalVisible(true);
    setReconcileStep("initial");
  };

  const handleReconcileYes = () => {
    // Account is reconciled - no changes needed
    setReconcileModalVisible(false);
    Alert.alert("Success", "Account reconciled successfully!");
  };

  const handleReconcileNo = () => {
    setReconcileStep("enter-balance");
    setReconcileBalance("");
    setReconcileBalanceNegative(false);
  };

  const handleCreateAdjustment = () => {
    const balance = parseFloat(reconcileBalance) || 0;
    const finalBalance = reconcileBalanceNegative
      ? -Math.abs(balance)
      : Math.abs(balance);

    // Create an adjustment transaction
    const adjustmentTransaction = {
      id: Date.now().toString(),
      payee: "Reconciliation Adjustment",
      amount: finalBalance - calculateClearedBalance(account!),
      categoryId: "", // No category for adjustments
      accountId: id as string,
      date: new Date().toISOString(),
    };

    // Add the adjustment transaction
    addTransaction(adjustmentTransaction);

    setReconcileModalVisible(false);
    Alert.alert("Success", "Account reconciled with adjustment!");
  };

  // Group transactions by date
  const groupTransactionsByDate = () => {
    const groups: { [key: string]: any[] } = {};

    accountTransactions.forEach((transaction) => {
      const date = new Date(transaction.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const renderTransaction = (transaction: any) => {
    const category = categories.find(
      (cat) => cat.id === transaction.categoryId
    );

    return (
      <View key={transaction.id} style={styles.transactionItem}>
        <View style={styles.transactionContent}>
          <View style={styles.transactionInfo}>
            <ThemedText type="subtitle" style={styles.transactionPayee}>
              {transaction.payee || "Transaction"}
            </ThemedText>
            <ThemedText style={styles.transactionCategory}>
              {category?.name || ""}
            </ThemedText>
          </View>
          <View style={styles.transactionAmountContainer}>
            <ThemedText
              style={[
                styles.transactionAmount,
                transaction.amount >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {transaction.amount >= 0 ? "+" : ""}$
              {Math.abs(transaction.amount).toFixed(2)}
            </ThemedText>
            <View
              style={[
                styles.statusIcon,
                {
                  backgroundColor:
                    transaction.amount >= 0 ? "#4CAF50" : "#F44336",
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderDateGroup = ([date, transactions]: [string, any[]]) => (
    <View key={date} style={styles.dateGroup}>
      <ThemedText style={styles.dateHeader}>{date}</ThemedText>
      <View style={styles.dateTransactions}>
        {transactions.map((transaction, index) => (
          <View key={transaction.id}>
            {renderTransaction(transaction)}
            {index < transactions.length - 1 && (
              <View style={styles.transactionDivider} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  if (!account) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
        <ThemedView style={styles.container}>
          <ThemedText>Account not found.</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
      <ThemedView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.accountName}>
            {account.name.toUpperCase()}
          </ThemedText>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
          >
            <ThemedText style={styles.menuIcon}>⋯</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.balance}>
          ${calculateWorkingBalance(account).toFixed(2)}
        </ThemedText>
        <ThemedText style={styles.workingBalance}>Working Balance</ThemedText>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={{ marginRight: 8 }}
          />
          <ThemedText style={styles.searchText}>Search Transactions</ThemedText>
        </View>
        <ScrollView style={styles.transactionsList}>
          {accountTransactions.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              No transactions yet
            </ThemedText>
          ) : (
            groupTransactionsByDate().map(renderDateGroup)
          )}
        </ScrollView>

        {/* Three dots menu */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleReconcile}
              >
                <ThemedText style={styles.menuItemText}>Reconcile</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteAccount}
              >
                <ThemedText style={[styles.menuItemText, styles.deleteText]}>
                  Delete Account
                </ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Reconcile modal */}
        <Modal
          visible={reconcileModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setReconcileModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {reconcileStep === "initial" ? (
                <>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Reconcile Account
                  </ThemedText>
                  <ThemedText style={styles.modalText}>
                    Does your bank's balance match the cleared balance shown in
                    YNAB?
                  </ThemedText>
                  <ThemedText style={styles.balanceText}>
                    Cleared Balance: $
                    {calculateClearedBalance(account).toFixed(2)}
                  </ThemedText>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handleReconcileYes}
                    >
                      <ThemedText style={styles.modalButtonText}>
                        Yes
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handleReconcileNo}
                    >
                      <ThemedText style={styles.modalButtonText}>No</ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Enter Bank Balance
                  </ThemedText>
                  <ThemedText style={styles.modalText}>
                    Enter your current cleared balance from your bank:
                  </ThemedText>
                  <View style={styles.balanceInputContainer}>
                    <TouchableOpacity
                      style={styles.negativeToggle}
                      onPress={() =>
                        setReconcileBalanceNegative(!reconcileBalanceNegative)
                      }
                    >
                      <ThemedText style={styles.negativeToggleText}>
                        {reconcileBalanceNegative ? "-" : "+"}
                      </ThemedText>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.balanceInput}
                      value={reconcileBalance}
                      onChangeText={setReconcileBalance}
                      placeholder="0.00"
                      placeholderTextColor="#888"
                      keyboardType="numeric"
                      selectionColor="#4CAF50"
                    />
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setReconcileModalVisible(false)}
                    >
                      <ThemedText style={styles.modalButtonText}>
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.createButton]}
                      onPress={handleCreateAdjustment}
                    >
                      <ThemedText style={styles.modalButtonText}>
                        Create Adjustment
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8, // Restore to original
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  accountName: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
  },
  unlinked: {
    color: "#888",
    marginBottom: 8,
    marginLeft: 40,
  },
  balance: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 40,
    marginTop: 12, // Restore to original
    marginBottom: 0,
    lineHeight: 38,
  },
  workingBalance: {
    color: "#888",
    marginBottom: 16,
    marginLeft: 40,
    marginTop: 2, // Add a little space below balance
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    marginLeft: 0,
  },
  searchText: {
    color: "#888",
    fontSize: 16,
  },
  transactionsList: {
    flex: 1,
  },
  transactionCategory: {
    color: "#888",
    fontSize: 13,
  },
  positive: {
    color: "#4CAF50",
  },
  negative: {
    color: "#F44336",
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  // New styles for menu and modal
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: "#fff",
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
    padding: 10,
    width: "80%",
    alignItems: "center",
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  menuItemText: {
    color: "#fff",
    fontSize: 18,
  },
  deleteText: {
    color: "#F44336",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#18191A",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#fff",
  },
  modalText: {
    color: "#888",
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  balanceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  createButton: {
    backgroundColor: "#F44336",
  },
  balanceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 20,
  },
  negativeToggle: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: "#333",
    marginRight: 8,
  },
  negativeToggleText: {
    color: "#F44336",
    fontSize: 18,
    fontWeight: "bold",
  },
  balanceInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: 0,
  },
  // New styles for grouped transactions
  dateGroup: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  dateTransactions: {
    // No specific styles needed here, transactions are handled by renderTransaction
  },
  transactionItem: {
    backgroundColor: "#18191A",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  transactionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionPayee: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 1,
    fontSize: 16,
  },
  transactionAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionAmount: {
    fontWeight: "bold",
    fontSize: 16,
  },
  statusIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  transactionDivider: {
    height: 1,
    backgroundColor: "#222",
    marginVertical: 8,
  },
});
