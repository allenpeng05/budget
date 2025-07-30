import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  Account,
  Category,
  CategoryGroup,
  Target,
  Transaction,
} from "../components/CategoryModel";

const CATEGORIES_KEY = "categories";
const TRANSACTIONS_KEY = "transactions";
const ACCOUNTS_KEY = "accounts";
const CATEGORY_GROUPS_KEY = "categoryGroups";
const TARGETS_KEY = "targets";

// Default category groups
const DEFAULT_GROUPS: CategoryGroup[] = [
  { id: "needs", name: "Needs", order: 1 },
  { id: "credit-card-payments", name: "Credit Card Payments", order: 2 },
  { id: "wants", name: "Wants", order: 3 },
  { id: "savings", name: "Savings", order: 4 },
];

export function useBudgetStorage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const catData = await AsyncStorage.getItem(CATEGORIES_KEY);
      const txData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      const accData = await AsyncStorage.getItem(ACCOUNTS_KEY);
      const groupsData = await AsyncStorage.getItem(CATEGORY_GROUPS_KEY);
      const targetsData = await AsyncStorage.getItem(TARGETS_KEY);

      setCategories(catData ? JSON.parse(catData) : []);
      setTransactions(txData ? JSON.parse(txData) : []);
      setAccounts(accData ? JSON.parse(accData) : []);

      // Load groups and initialize defaults if needed
      const groups = groupsData ? JSON.parse(groupsData) : [];
      setCategoryGroups(groups);

      setTargets(targetsData ? JSON.parse(targetsData) : []);

      setLoading(false);

      // Initialize default groups if none exist
      if (groups.length === 0) {
        await saveCategoryGroups(DEFAULT_GROUPS);
      }
    }
    loadData();
  }, []);

  const saveCategories = async (cats: Category[]) => {
    setCategories(cats);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  };

  const saveTransactions = async (txs: Transaction[]) => {
    setTransactions(txs);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
  };

  const saveAccounts = async (accs: Account[]) => {
    setAccounts(accs);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
  };

  const saveCategoryGroups = async (groups: CategoryGroup[]) => {
    setCategoryGroups(groups);
    await AsyncStorage.setItem(CATEGORY_GROUPS_KEY, JSON.stringify(groups));
  };

  const saveTargets = async (targetsList: Target[]) => {
    setTargets(targetsList);
    await AsyncStorage.setItem(TARGETS_KEY, JSON.stringify(targetsList));
  };

  // Initialize default category groups if none exist
  const initializeDefaultGroups = async () => {
    if (categoryGroups.length === 0) {
      await saveCategoryGroups(DEFAULT_GROUPS);
    }
  };

  // Refresh all data from storage
  const refreshData = useCallback(async () => {
    setLoading(true);
    const catData = await AsyncStorage.getItem(CATEGORIES_KEY);
    const txData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    const accData = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const groupsData = await AsyncStorage.getItem(CATEGORY_GROUPS_KEY);
    const targetsData = await AsyncStorage.getItem(TARGETS_KEY);

    setCategories(catData ? JSON.parse(catData) : []);
    setTransactions(txData ? JSON.parse(txData) : []);
    setAccounts(accData ? JSON.parse(accData) : []);

    // Load groups and initialize defaults if needed
    const groups = groupsData ? JSON.parse(groupsData) : [];
    setCategoryGroups(groups);

    setTargets(targetsData ? JSON.parse(targetsData) : []);

    setLoading(false);

    // Initialize default groups if none exist
    if (groups.length === 0) {
      await saveCategoryGroups(DEFAULT_GROUPS);
    }
  }, []);

  // Create credit card payment category when credit card account is created
  const createCreditCardPaymentCategory = async (
    creditCardAccount: Account
  ) => {
    // Ensure the Credit Card Payments group exists
    const creditCardPaymentsGroup = categoryGroups.find(
      (group) => group.id === "credit-card-payments"
    );

    if (!creditCardPaymentsGroup) {
      const newGroup: CategoryGroup = {
        id: "credit-card-payments",
        name: "Credit Card Payments",
        order: categoryGroups.length,
      };
      const updatedGroups = [...categoryGroups, newGroup];
      await saveCategoryGroups(updatedGroups);
    }

    const paymentCategory: Category = {
      id: `cc-payment-${creditCardAccount.id}`,
      name: creditCardAccount.name, // Just use the account name, not "Payment"
      budgeted: 0,
      groupId: "credit-card-payments",
    };

    const updatedCategories = [...categories, paymentCategory];
    await saveCategories(updatedCategories);
  };

  // Add account with special handling for credit cards
  const addAccount = async (account: Account) => {
    const updatedAccounts = [...accounts, account];
    await saveAccounts(updatedAccounts);

    // If it's a credit card, create the payment category
    if (account.type === "credit-card") {
      await createCreditCardPaymentCategory(account);
    }
  };

  // Process a new transaction and update all related data
  const addTransaction = async (transaction: Transaction) => {
    // Add the transaction
    const updatedTransactions = [...transactions, transaction];
    await saveTransactions(updatedTransactions);

    // Handle credit card transactions
    const account = accounts.find((acc) => acc.id === transaction.accountId);
    if (account?.type === "credit-card" && transaction.amount < 0) {
      // Find the credit card payment category for this account
      const paymentCategory = categories.find(
        (cat) => cat.id === `cc-payment-${transaction.accountId}`
      );

      if (paymentCategory) {
        // Move money from spending category to credit card payment category
        const updatedCategories = categories.map((cat) => {
          if (cat.id === transaction.categoryId) {
            // Reduce the spending category's budgeted amount (since we spent it)
            return {
              ...cat,
              budgeted: cat.budgeted - Math.abs(transaction.amount),
            };
          }
          if (cat.id === paymentCategory.id) {
            // Increase the credit card payment category (money set aside for payment)
            return {
              ...cat,
              budgeted: cat.budgeted + Math.abs(transaction.amount),
            };
          }
          return cat;
        });
        await saveCategories(updatedCategories);
      }
    } else {
      // For regular accounts, just reduce the category's budgeted amount
      const updatedCategories = categories.map((cat) =>
        cat.id === transaction.categoryId
          ? { ...cat, budgeted: cat.budgeted - Math.abs(transaction.amount) }
          : cat
      );
      await saveCategories(updatedCategories);
    }
  };

  return {
    categories,
    setCategories: saveCategories,
    transactions,
    setTransactions: saveTransactions,
    accounts,
    setAccounts: saveAccounts,
    addAccount,
    addTransaction,
    categoryGroups,
    setCategoryGroups: saveCategoryGroups,
    targets,
    setTargets: saveTargets,
    loading,
    refreshData,
  };
}
