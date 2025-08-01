import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Category,
  CategoryGroup,
  Target,
} from "../../components/CategoryModel";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { useBudgetStorage } from "../../hooks/useBudgetStorage";
import CustomNumberPad from "../components/CustomNumberPad";
export default function PlanScreen() {
  const navigation = useNavigation();
  const {
    categories,
    setCategories,
    categoryGroups,
    setCategoryGroups,
    transactions,
    accounts,
    targets,
    setTargets,
    loading,
    refreshData,
  } = useBudgetStorage();
  const [modalVisible, setModalVisible] = useState(false);
  const [editPlanModalVisible, setEditPlanModalVisible] = useState(false);
  const [newGroupModalVisible, setNewGroupModalVisible] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [budgeted, setBudgeted] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [planName, setPlanName] = useState("Plan");
  const [groupMenuVisible, setGroupMenuVisible] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] =
    useState<CategoryGroup | null>(null);
  const [editGroupModalVisible, setEditGroupModalVisible] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [newCategoryModalVisible, setNewCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedGroupForCategory, setSelectedGroupForCategory] =
    useState<CategoryGroup | null>(null);
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [selectedCategoryForTarget, setSelectedCategoryForTarget] =
    useState<Category | null>(null);
  const [targetFrequency, setTargetFrequency] = useState<
    "weekly" | "monthly" | "custom"
  >("monthly");
  const [targetAmount, setTargetAmount] = useState("0.00");
  const [targetAmountFocused, setTargetAmountFocused] = useState(false);
  const [targetPendingAmount, setTargetPendingAmount] = useState("");
  const [targetPadMemory, setTargetPadMemory] = useState<number | null>(null);
  const [targetPadOperator, setTargetPadOperator] = useState<
    "add" | "subtract" | undefined
  >(undefined);
  const [targetDueDay, setTargetDueDay] = useState("31");

  const [targetNextMonthBehavior, setTargetNextMonthBehavior] = useState<
    "setAside" | "refill"
  >("setAside");
  const [targetDueDayDropdownVisible, setTargetDueDayDropdownVisible] =
    useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderData, setReorderData] = useState<
    Array<{
      id: string;
      name: string;
      type: "group" | "category";
      groupId?: string;
      order: number;
    }>
  >([]);

  // Assign Money Modal State
  const [assignMoneyModalVisible, setAssignMoneyModalVisible] = useState(false);
  const [selectedCategoryForAssignment, setSelectedCategoryForAssignment] =
    useState<Category | null>(null);
  const [assignmentAmount, setAssignmentAmount] = useState("$0.00");
  const [assignmentPendingAmount, setAssignmentPendingAmount] = useState("");
  const [assignmentAmountFocused, setAssignmentAmountFocused] = useState(false);
  const [assignmentPadMemory, setAssignmentPadMemory] = useState<number | null>(
    null
  );
  const [assignmentPadOperator, setAssignmentPadOperator] = useState<
    "add" | "subtract" | undefined
  >(undefined);

  // ScrollView ref for auto-scroll functionality
  const assignMoneyScrollViewRef = useRef<ScrollView>(null);
  const mainPlanScrollViewRef = useRef<ScrollView>(null);

  // Main Plan Editing State
  const [selectedCategoryForMainEdit, setSelectedCategoryForMainEdit] =
    useState<Category | null>(null);
  const [mainEditAmount, setMainEditAmount] = useState("$0.00");
  const [mainEditPendingAmount, setMainEditPendingAmount] = useState("");
  const [mainEditAmountFocused, setMainEditAmountFocused] = useState(false);
  const [mainEditPadMemory, setMainEditPadMemory] = useState<number | null>(
    null
  );
  const [mainEditPadOperator, setMainEditPadOperator] = useState<
    "add" | "subtract" | undefined
  >(undefined);
  const [hasStartedEditing, setHasStartedEditing] = useState(false);

  // Keyboard height state
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ScrollView height state
  const [mainPlanScrollViewHeight, setMainPlanScrollViewHeight] = useState(0);
  const [assignMoneyScrollViewHeight, setAssignMoneyScrollViewHeight] =
    useState(0);

  // Category refs for layout measurement
  const categoryRefs = useRef<{ [key: string]: any }>({});

  // Assigned Too Much Modal State
  const [assignedTooMuchModalVisible, setAssignedTooMuchModalVisible] =
    useState(false);
  const [selectedCategoryForSubtraction, setSelectedCategoryForSubtraction] =
    useState<Category | null>(null);
  const [subtractionAmount, setSubtractionAmount] = useState("$0.00");
  const [subtractionPendingAmount, setSubtractionPendingAmount] = useState("");
  const [subtractionAmountFocused, setSubtractionAmountFocused] =
    useState(false);
  const [subtractionPadMemory, setSubtractionPadMemory] = useState<
    number | null
  >(null);
  const [subtractionPadOperator, setSubtractionPadOperator] = useState<
    "add" | "subtract" | undefined
  >(undefined);

  // Helper function to find category index in main plan list
  const getCategoryIndexInMainPlan = (targetCategory: Category) => {
    let index = 0;
    for (const group of categoryGroups.sort((a, b) => a.order - b.order)) {
      const groupCategories = getCategoriesByGroup(group.id);
      for (const category of groupCategories) {
        if (category.id === targetCategory.id) {
          return index;
        }
        index++;
      }
    }
    return -1;
  };

  // Main Plan Editing Functions
  const selectCategoryForMainEdit = (category: Category) => {
    setSelectedCategoryForMainEdit(category);
    setMainEditAmountFocused(true);
    // Reset all calculator states for fresh start
    setMainEditAmount("$0.00");
    setMainEditPendingAmount("");
    setMainEditPadMemory(null);
    setMainEditPadOperator(undefined);
    setHasStartedEditing(false);

    // Auto-scroll to bring selected category into view above number pad
    setTimeout(() => {
      const categoryRef = categoryRefs.current[category.id];
      if (categoryRef && mainPlanScrollViewRef.current) {
        categoryRef.measureLayout(
          mainPlanScrollViewRef.current,
          (x: number, y: number, width: number, height: number) => {
            // Get ScrollView-relative dimensions
            const numberPadHeight = keyboardHeight || 250; // Use actual keyboard height or fallback
            const categoryBottomY = y + height;
            const visibleHeight = mainPlanScrollViewHeight - numberPadHeight;

            // Only scroll if the category is blocked by the number pad
            if (categoryBottomY > visibleHeight) {
              // Calculate scroll offset to position category above number pad
              const targetScrollY = y - 100; // 100px buffer above category

              mainPlanScrollViewRef.current?.scrollTo({
                y: Math.max(0, targetScrollY),
                animated: true,
              });
            }
          },
          () => {
            // Error callback - fallback to no scroll
            console.log("Failed to measure category layout");
          }
        );
      }
    }, 100);
  };

  const handleMainEditPadPress = (digit: string) => {
    if (mainEditAmountFocused) {
      setMainEditPendingAmount((prev) => prev + digit);
    }
  };

  const handleMainEditPadBackspace = () => {
    if (mainEditPendingAmount.length > 0) {
      // Remove last digit
      setMainEditPendingAmount(mainEditPendingAmount.slice(0, -1));
      setHasStartedEditing(true);
    } else if (
      selectedCategoryForMainEdit &&
      !mainEditPadOperator &&
      mainEditAmountFocused &&
      !hasStartedEditing
    ) {
      // On very first backspace, initialize with current budget and remove one digit
      const currentAmount = selectedCategoryForMainEdit.budgeted;
      const amountInCents = Math.floor(currentAmount * 100).toString();

      if (amountInCents.length > 1) {
        setMainEditPendingAmount(amountInCents.slice(0, -1));
      } else {
        setMainEditPendingAmount("0");
      }

      setHasStartedEditing(true);
    }
    // Else: already empty and already editing — do nothing
  };

  const handleMainEditPadAdd = () => {
    if (mainEditAmountFocused && selectedCategoryForMainEdit) {
      const currentValue =
        mainEditPendingAmount !== "" || hasStartedEditing
          ? parseFloat(mainEditPendingAmount || "0") / 100
          : selectedCategoryForMainEdit.budgeted;

      setMainEditPadOperator("add");
      setMainEditPadMemory(currentValue);
      setMainEditPendingAmount(""); // Clear for the next operand
    }
  };

  const handleMainEditPadSubtract = () => {
    if (mainEditAmountFocused && selectedCategoryForMainEdit) {
      const currentValue =
        mainEditPendingAmount !== "" || hasStartedEditing
          ? parseFloat(mainEditPendingAmount || "0") / 100
          : selectedCategoryForMainEdit.budgeted;

      setMainEditPadOperator("subtract");
      setMainEditPadMemory(currentValue);
      setMainEditPendingAmount("");
    }
  };

  const handleMainEditPadDone = () => {
    if (selectedCategoryForMainEdit) {
      saveMainEdit();
      setMainEditAmountFocused(false);
      setSelectedCategoryForMainEdit(null);

      // Force a small delay to ensure the number pad is fully removed before allowing scrolling
      setTimeout(() => {
        if (mainPlanScrollViewRef.current) {
          // Trigger a small scroll to refresh the ScrollView's touch handling
          mainPlanScrollViewRef.current.scrollTo({
            y: 0,
            animated: false,
          });
        }
      }, 50);
    }
  };

  const saveMainEdit = () => {
    if (selectedCategoryForMainEdit) {
      let finalAmount = 0;

      if (mainEditPadOperator && mainEditPadMemory !== null) {
        // Handle operations (+ or -)
        const operationAmount = mainEditPendingAmount
          ? parseFloat(mainEditPendingAmount) / 100
          : 0;

        if (mainEditPadOperator === "add") {
          finalAmount = mainEditPadMemory + operationAmount;
        } else if (mainEditPadOperator === "subtract") {
          finalAmount = Math.max(0, mainEditPadMemory - operationAmount);
        }
      } else if (mainEditPendingAmount) {
        // Direct amount entry
        finalAmount = parseFloat(mainEditPendingAmount) / 100;
      } else if (hasStartedEditing) {
        // User has started editing but no pending amount - save 0
        finalAmount = 0;
      } else {
        // No change
        finalAmount = selectedCategoryForMainEdit.budgeted;
      }

      // Update the category
      const updatedCategories = categories.map((cat) =>
        cat.id === selectedCategoryForMainEdit.id
          ? { ...cat, budgeted: finalAmount }
          : cat
      );
      setCategories(updatedCategories);

      // Reset states
      setMainEditAmount("$0.00");
      setMainEditPendingAmount("");
      setMainEditPadMemory(null);
      setMainEditPadOperator(undefined);
    }
  };

  const openAssignedTooMuchModal = () => {
    setAssignedTooMuchModalVisible(true);
  };

  // Keyboard listeners for accurate height measurement
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Control tab bar visibility based on number pad state
  useEffect(() => {
    const hideTabBar = () => {
      // Try multiple approaches to hide the tab bar
      try {
        // Approach 1: Direct navigation
        navigation.setOptions({
          tabBarStyle: { display: "none" },
        });
      } catch (e) {
        console.log("Direct navigation failed:", e);
      }

      try {
        // Approach 2: Parent navigation
        const parent = navigation.getParent();
        if (parent && parent.setOptions) {
          parent.setOptions({
            tabBarStyle: { display: "none" },
          });
        }
      } catch (e) {
        console.log("Parent navigation failed:", e);
      }

      try {
        // Approach 3: Grandparent navigation
        const parent = navigation.getParent();
        if (parent && parent.getParent) {
          const grandParent = parent.getParent();
          if (grandParent && grandParent.setOptions) {
            grandParent.setOptions({
              tabBarStyle: { display: "none" },
            });
          }
        }
      } catch (e) {
        console.log("Grandparent navigation failed:", e);
      }
    };

    const showTabBar = () => {
      // Try multiple approaches to show the tab bar
      try {
        // Approach 1: Direct navigation
        navigation.setOptions({
          tabBarStyle: Platform.select({
            ios: { position: "absolute" },
            default: {},
          }),
        });
      } catch (e) {
        console.log("Direct navigation failed:", e);
      }

      try {
        // Approach 2: Parent navigation
        const parent = navigation.getParent();
        if (parent && parent.setOptions) {
          parent.setOptions({
            tabBarStyle: Platform.select({
              ios: { position: "absolute" },
              default: {},
            }),
          });
        }
      } catch (e) {
        console.log("Parent navigation failed:", e);
      }

      try {
        // Approach 3: Grandparent navigation
        const parent = navigation.getParent();
        if (parent && parent.getParent) {
          const grandParent = parent.getParent();
          if (grandParent && grandParent.setOptions) {
            grandParent.setOptions({
              tabBarStyle: Platform.select({
                ios: { position: "absolute" },
                default: {},
              }),
            });
          }
        }
      } catch (e) {
        console.log("Grandparent navigation failed:", e);
      }
    };

    if (mainEditAmountFocused) {
      // Add a small delay to ensure the state is properly set
      setTimeout(hideTabBar, 50);
    } else {
      setTimeout(showTabBar, 50);
    }

    // Cleanup function to ensure tab bar is shown when component unmounts
    return () => {
      if (!mainEditAmountFocused) {
        showTabBar();
      }
    };
  }, [mainEditAmountFocused, navigation]);

  // Cleanup when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Reset main edit state when leaving screen
        setSelectedCategoryForMainEdit(null);
        setMainEditAmountFocused(false);
        setMainEditPendingAmount("");
        setMainEditPadMemory(null);
        setMainEditPadOperator(undefined);
      };
    }, [])
  );

  // Auto-close assigned too much modal when balance is corrected
  useEffect(() => {
    if (assignedTooMuchModalVisible && calculateReadyToAssign() >= -0.01) {
      // Balance is no longer over-assigned, close the modal
      setAssignedTooMuchModalVisible(false);
      setSelectedCategoryForSubtraction(null);
      setSubtractionAmountFocused(false);
      setSubtractionAmount("$0.00");
      setSubtractionPendingAmount("");
      setSubtractionPadMemory(null);
      setSubtractionPadOperator(undefined);
    }
  }, [assignedTooMuchModalVisible, categories]); // Trigger when categories change (which affects balance)

  const selectCategoryForSubtraction = (category: Category) => {
    setSelectedCategoryForSubtraction(category);
    setSubtractionAmountFocused(true);
    // Reset all calculator states for fresh start
    setSubtractionAmount("$0.00");
    setSubtractionPendingAmount("");
    setSubtractionPadMemory(null);
    setSubtractionPadOperator(undefined);
  };

  // Subtraction number pad handlers
  const handleSubtractionPadPress = (digit: string) => {
    if (subtractionAmountFocused) {
      setSubtractionPendingAmount((prev) => prev + digit);
    }
  };

  const handleSubtractionPadBackspace = () => {
    if (subtractionAmountFocused) {
      if (subtractionPendingAmount) {
        setSubtractionPendingAmount((prev) => prev.slice(0, -1));
      } else if (
        selectedCategoryForSubtraction &&
        selectedCategoryForSubtraction.budgeted > 0
      ) {
        // Backspace from existing budgeted amount
        const currentBudgetedCents = Math.round(
          selectedCategoryForSubtraction.budgeted * 100
        );
        const newBudgetedCents = Math.floor(currentBudgetedCents / 10);
        const newBudgeted = newBudgetedCents / 100;

        // Update the category directly
        const updatedCategories = categories.map((cat) =>
          cat.id === selectedCategoryForSubtraction.id
            ? { ...cat, budgeted: newBudgeted }
            : cat
        );
        setCategories(updatedCategories);
      }
    }
  };

  const handleSubtractionPadSubtract = () => {
    if (subtractionAmountFocused && selectedCategoryForSubtraction) {
      setSubtractionPadOperator("subtract");
      setSubtractionPadMemory(selectedCategoryForSubtraction.budgeted);
    }
  };

  const handleSubtractionPadDone = () => {
    if (selectedCategoryForSubtraction) {
      saveSubtraction();
      setSubtractionAmountFocused(false);
      setSelectedCategoryForSubtraction(null);
    }
  };

  const saveSubtraction = () => {
    if (selectedCategoryForSubtraction) {
      let finalAmount = selectedCategoryForSubtraction.budgeted;

      if (subtractionPadOperator && subtractionPadMemory !== null) {
        // Handle subtraction operation
        const operationAmount = subtractionPendingAmount
          ? parseFloat(subtractionPendingAmount) / 100
          : 0;

        if (subtractionPadOperator === "subtract") {
          finalAmount = Math.max(0, subtractionPadMemory - operationAmount);
        }
      } else if (subtractionPendingAmount) {
        // Direct amount entry (subtract this amount from current)
        const enteredAmount = parseFloat(subtractionPendingAmount) / 100;
        finalAmount = Math.max(
          0,
          selectedCategoryForSubtraction.budgeted - enteredAmount
        );
      }

      // Update the category
      const updatedCategories = categories.map((cat) =>
        cat.id === selectedCategoryForSubtraction.id
          ? { ...cat, budgeted: finalAmount }
          : cat
      );
      setCategories(updatedCategories);

      // Reset states
      setSubtractionAmount("$0.00");
      setSubtractionPendingAmount("");
      setSubtractionPadMemory(null);
      setSubtractionPadOperator(undefined);
    }
  };

  // Helper function to find category index in assign money list
  const getCategoryIndexInAssignMoneyList = (targetCategory: Category) => {
    let index = 0;
    for (const group of categoryGroups.sort((a, b) => a.order - b.order)) {
      const groupCategories = getCategoriesByGroup(group.id);
      for (const category of groupCategories) {
        if (category.id === targetCategory.id) {
          return index;
        }
        index++;
      }
    }
    return -1;
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
      // Also reload plan name when screen comes into focus
      const loadPlanName = async () => {
        try {
          const savedPlanName = await AsyncStorage.getItem("planName");
          if (savedPlanName) {
            setPlanName(savedPlanName);
          } else {
            setPlanName("Plan"); // Reset to default if no saved name
          }
        } catch (error) {
          console.error("Error loading plan name:", error);
        }
      };
      loadPlanName();
    }, [refreshData])
  );

  const calculateTotalCash = () => {
    return accounts
      .filter(
        (account) => account.type === "checking" || account.type === "savings"
      )
      .reduce((sum, account) => sum + account.balance, 0);
  };

  const calculateTotalAssigned = () => {
    return categories.reduce((sum, category) => sum + category.budgeted, 0);
  };

  const calculateReadyToAssign = () => {
    return calculateTotalCash() - calculateTotalAssigned();
  };

  const addCategory = () => {
    if (!categoryName || !selectedGroup || isNaN(Number(budgeted))) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: categoryName,
      budgeted: Number(budgeted),
      groupId: selectedGroup,
    };

    setCategories([...categories, newCategory]);
    setModalVisible(false);
    setCategoryName("");
    setBudgeted("");
    setSelectedGroup("");
  };

  const addNewGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: CategoryGroup = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        order: categoryGroups.length,
      };

      setCategoryGroups([...categoryGroups, newGroup]);
      setNewGroupModalVisible(false);
      setNewGroupName("");
    }
  };

  const handleEditGroup = () => {
    if (selectedGroupForEdit && editGroupName.trim()) {
      const updatedGroups = categoryGroups.map((group) =>
        group.id === selectedGroupForEdit.id
          ? { ...group, name: editGroupName.trim() }
          : group
      );
      setCategoryGroups(updatedGroups);
      setEditGroupModalVisible(false);
      setSelectedGroupForEdit(null);
      setEditGroupName("");
    }
  };

  const handleDeleteGroup = () => {
    if (selectedGroupForEdit) {
      Alert.alert(
        "Delete Group",
        `Are you sure you want to delete "${selectedGroupForEdit.name}"? This will also delete all categories in this group.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              const updatedGroups = categoryGroups.filter(
                (group) => group.id !== selectedGroupForEdit.id
              );
              const updatedCategories = categories.filter(
                (category) => category.groupId !== selectedGroupForEdit.id
              );
              setCategoryGroups(updatedGroups);
              setCategories(updatedCategories);
              setGroupMenuVisible(false);
              setSelectedGroupForEdit(null);
            },
          },
        ]
      );
    }
  };

  const openNewCategoryModal = (group: CategoryGroup) => {
    setSelectedGroupForCategory(group);
    setNewCategoryModalVisible(true);
  };

  const addNewCategory = () => {
    if (selectedGroupForCategory && newCategoryName.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        budgeted: 0,
        groupId: selectedGroupForCategory.id,
      };

      setCategories([...categories, newCategory]);

      // Reset form
      setNewCategoryName("");
      setNewCategoryModalVisible(false);
      setSelectedGroupForCategory(null);
    }
  };

  const openTargetModal = (category: Category) => {
    setSelectedCategoryForTarget(category);
    setTargetModalVisible(true);

    // Check if category already has a target for editing
    const existingTarget = getTargetForCategory(category.id);

    if (existingTarget) {
      // Pre-populate with existing target data for editing
      setTargetAmount(`$${existingTarget.targetAmount.toFixed(2)}`);
      setTargetFrequency(existingTarget.frequency);
      setTargetNextMonthBehavior(existingTarget.nextMonthBehavior);

      if (existingTarget.frequency === "monthly") {
        setTargetDueDay(existingTarget.dueDay?.toString() || "1");
      } else if (existingTarget.frequency === "weekly") {
        setTargetDueDay(existingTarget.dueDay?.toString() || "1");
      } else if (existingTarget.frequency === "custom") {
        setTargetDueDay(existingTarget.dueDate || "");
      }
    } else {
      // Reset all target-related state for a new target
      setTargetAmount("$0.00");
      setTargetFrequency("monthly");
      setTargetNextMonthBehavior("setAside");
      setTargetDueDay("1");
    }

    // Always reset these states
    setTargetPendingAmount("");
    setTargetPadMemory(null);
    setTargetPadOperator(undefined);
    setTargetAmountFocused(false);
    setTargetDueDayDropdownVisible(false);
  };

  const getFormattedTargetAmount = (amount: string) => {
    return amount.startsWith("$") ? amount : `$${amount}`;
  };

  const getFormattedPendingAmount = (pendingAmount: string) => {
    if (!pendingAmount) return "$0.00";
    const value = parseFloat(pendingAmount) / 100;
    return `$${value.toFixed(2)}`;
  };

  const handleTargetPadPress = (num: string) => {
    if (targetPendingAmount.length < 8) {
      setTargetPendingAmount(targetPendingAmount + num);
    }
  };

  const handleTargetPadBackspace = () => {
    setTargetPendingAmount(targetPendingAmount.slice(0, -1));
  };

  const handleTargetPadAdd = () => {
    const currentValue = parseFloat(targetPendingAmount || "0") / 100;
    setTargetPadMemory(currentValue);
    setTargetPadOperator("add");
    setTargetPendingAmount("");
  };

  const handleTargetPadSubtract = () => {
    const currentValue = parseFloat(targetPendingAmount || "0") / 100;
    setTargetPadMemory(currentValue);
    setTargetPadOperator("subtract");
    setTargetPendingAmount("");
  };

  const handleTargetPadEquals = () => {
    if (targetPadMemory !== null && targetPadOperator) {
      const currentValue = parseFloat(targetPendingAmount || "0") / 100;
      let result = 0;

      if (targetPadOperator === "add") {
        result = targetPadMemory + currentValue;
      } else if (targetPadOperator === "subtract") {
        result = targetPadMemory - currentValue;
      }

      setTargetAmount(`$${result.toFixed(2)}`);
      setTargetPendingAmount("");
      setTargetPadMemory(null);
      setTargetPadOperator(undefined);
    }
  };

  const handleTargetPadDone = () => {
    if (targetPendingAmount) {
      const value = parseFloat(targetPendingAmount) / 100;
      setTargetAmount(`$${value.toFixed(2)}`);
    }
    setTargetAmountFocused(false);
    setTargetPendingAmount("");
    setTargetPadMemory(null);
    setTargetPadOperator(undefined);
  };

  // Assignment Money Pad Functions
  const handleAssignmentPadPress = (num: string) => {
    if (assignmentPendingAmount.length < 8) {
      setAssignmentPendingAmount(assignmentPendingAmount + num);
    }
  };

  const handleAssignmentPadBackspace = () => {
    if (assignmentPendingAmount.length > 0) {
      // Remove last digit from pending amount
      setAssignmentPendingAmount(assignmentPendingAmount.slice(0, -1));
    } else if (selectedCategoryForAssignment && !assignmentPadOperator) {
      // If no pending amount and no operator, start editing current category amount
      const currentAmount = selectedCategoryForAssignment.budgeted;
      const amountInCents = Math.floor(currentAmount * 100).toString();
      if (amountInCents.length > 1) {
        // Remove last digit (LIFO)
        setAssignmentPendingAmount(amountInCents.slice(0, -1));
      } else if (amountInCents === "0") {
        // If amount is 0, stay at 0
        setAssignmentPendingAmount("");
      } else {
        // If single digit, set to empty
        setAssignmentPendingAmount("");
      }
    }
  };

  const handleAssignmentPadAdd = () => {
    if (selectedCategoryForAssignment) {
      const currentCategoryAmount = selectedCategoryForAssignment.budgeted;
      setAssignmentPadMemory(currentCategoryAmount);
      setAssignmentPadOperator("add");
      setAssignmentPendingAmount("");
    }
  };

  const handleAssignmentPadSubtract = () => {
    if (selectedCategoryForAssignment) {
      const currentCategoryAmount = selectedCategoryForAssignment.budgeted;
      setAssignmentPadMemory(currentCategoryAmount);
      setAssignmentPadOperator("subtract");
      setAssignmentPendingAmount("");
    }
  };

  const handleAssignmentPadEquals = () => {
    if (assignmentPadMemory !== null && assignmentPadOperator) {
      const currentValue = parseFloat(assignmentPendingAmount || "0") / 100;
      let result = 0;

      if (assignmentPadOperator === "add") {
        result = assignmentPadMemory + currentValue;
      } else if (assignmentPadOperator === "subtract") {
        result = Math.max(0, assignmentPadMemory - currentValue); // Don't allow negative
      }

      setAssignmentAmount(`$${result.toFixed(2)}`);
      setAssignmentPendingAmount("");
      setAssignmentPadMemory(null);
      setAssignmentPadOperator(undefined);
    }
  };

  const handleAssignmentPadDone = () => {
    if (assignmentPendingAmount) {
      const value = parseFloat(assignmentPendingAmount) / 100;
      setAssignmentAmount(`$${value.toFixed(2)}`);
    } else if (assignmentPadMemory !== null && assignmentPadOperator) {
      // Handle case where user clicks done without entering second number
      handleAssignmentPadEquals();
    }

    // Save the assignment but don't close the modal
    if (selectedCategoryForAssignment) {
      let finalAmount = 0;

      if (assignmentPadOperator && assignmentPadMemory !== null) {
        // Handle operations (+ or -)
        const operationAmount = assignmentPendingAmount
          ? parseFloat(assignmentPendingAmount) / 100
          : 0;

        if (assignmentPadOperator === "add") {
          finalAmount = assignmentPadMemory + operationAmount;
        } else if (assignmentPadOperator === "subtract") {
          finalAmount = Math.max(0, assignmentPadMemory - operationAmount);
        }
      } else if (assignmentPendingAmount) {
        // Direct amount entry
        finalAmount = parseFloat(assignmentPendingAmount) / 100;
      } else if (assignmentAmount !== "$0.00") {
        // Use assignment amount
        finalAmount = parseFloat(assignmentAmount.replace("$", ""));
      }

      if (finalAmount >= 0) {
        const updatedCategories = categories.map((cat) =>
          cat.id === selectedCategoryForAssignment.id
            ? { ...cat, budgeted: finalAmount }
            : cat
        );
        setCategories(updatedCategories);
      }
    }

    // Reset states but keep modal open
    setSelectedCategoryForAssignment(null);
    setAssignmentAmount("$0.00");
    setAssignmentPendingAmount("");
    setAssignmentAmountFocused(false);
    setAssignmentPadMemory(null);
    setAssignmentPadOperator(undefined);
  };

  const getDayOfWeekName = (day: number) => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return days[day - 1] || "Monday";
  };

  const openAssignMoneyModal = () => {
    setAssignMoneyModalVisible(true);
    setAssignmentAmount("$0.00");
    setAssignmentPendingAmount("");
    setAssignmentAmountFocused(false);
    setAssignmentPadMemory(null);
    setAssignmentPadOperator(undefined);
    setSelectedCategoryForAssignment(null);
  };

  const selectCategoryForAssignment = (category: Category) => {
    setSelectedCategoryForAssignment(category);
    setAssignmentAmountFocused(true);
    // Reset all calculator states for fresh start
    setAssignmentAmount("$0.00");
    setAssignmentPendingAmount("");
    setAssignmentPadMemory(null);
    setAssignmentPadOperator(undefined);

    // Auto-scroll to bring selected category into view above number pad
    setTimeout(() => {
      const categoryRef = categoryRefs.current[category.id];
      if (categoryRef && assignMoneyScrollViewRef.current) {
        categoryRef.measureLayout(
          assignMoneyScrollViewRef.current,
          (x: number, y: number, width: number, height: number) => {
            // Get ScrollView-relative dimensions
            const numberPadHeight = keyboardHeight || 250; // Use actual keyboard height or fallback
            const categoryBottomY = y + height;
            const visibleHeight = assignMoneyScrollViewHeight - numberPadHeight;

            // Only scroll if the category is blocked by the number pad
            if (categoryBottomY > visibleHeight) {
              // Calculate scroll offset to position category above number pad
              const targetScrollY = y - 100; // 100px buffer above category

              assignMoneyScrollViewRef.current?.scrollTo({
                y: Math.max(0, targetScrollY),
                animated: true,
              });
            }
          },
          () => {
            // Error callback - fallback to no scroll
            console.log("Failed to measure category layout");
          }
        );
      }
    }, 100);
  };

  const saveAssignment = () => {
    if (selectedCategoryForAssignment) {
      let finalAmount = 0;

      if (assignmentPadOperator && assignmentPadMemory !== null) {
        // Handle operations (+ or -)
        const operationAmount = assignmentPendingAmount
          ? parseFloat(assignmentPendingAmount) / 100
          : 0;

        if (assignmentPadOperator === "add") {
          finalAmount = assignmentPadMemory + operationAmount;
        } else if (assignmentPadOperator === "subtract") {
          finalAmount = Math.max(0, assignmentPadMemory - operationAmount);
        }
      } else if (assignmentPendingAmount) {
        // Direct amount entry
        finalAmount = parseFloat(assignmentPendingAmount) / 100;
      } else if (assignmentAmount !== "$0.00") {
        // Use assignment amount
        finalAmount = parseFloat(assignmentAmount.replace("$", ""));
      }

      if (finalAmount >= 0) {
        const updatedCategories = categories.map((cat) =>
          cat.id === selectedCategoryForAssignment.id
            ? { ...cat, budgeted: finalAmount }
            : cat
        );
        setCategories(updatedCategories);
      }
    }
    setAssignMoneyModalVisible(false);
    setSelectedCategoryForAssignment(null);
    setAssignmentAmount("$0.00");
    setAssignmentPendingAmount("");
    setAssignmentAmountFocused(false);
    setAssignmentPadMemory(null);
    setAssignmentPadOperator(undefined);
  };

  const saveTarget = () => {
    if (selectedCategoryForTarget) {
      const targetAmountValue = parseFloat(targetAmount.replace("$", "")) || 0;

      const newTarget: Target = {
        id: Date.now().toString(),
        categoryId: selectedCategoryForTarget.id,
        frequency: targetFrequency,
        targetAmount: targetAmountValue,
        nextMonthBehavior: targetNextMonthBehavior,
        dueDay:
          targetFrequency === "monthly"
            ? parseInt(targetDueDay)
            : targetFrequency === "weekly"
            ? parseInt(targetDueDay)
            : undefined,
        dueDate: targetFrequency === "custom" ? targetDueDay : undefined, // For custom, targetDueDay contains the date string
      };

      setTargets([...targets, newTarget]);
    }

    setTargetModalVisible(false);
    setSelectedCategoryForTarget(null);
    // Reset all target states
    setTargetAmount("$0.00");
    setTargetPendingAmount("");
    setTargetPadMemory(null);
    setTargetPadOperator(undefined);
    setTargetDueDay("1");
    setTargetAmountFocused(false);
    setTargetNextMonthBehavior("setAside");
    setTargetFrequency("monthly");
    setTargetDueDayDropdownVisible(false);
  };

  const openGroupMenu = (group: CategoryGroup) => {
    setSelectedGroupForEdit(group);
    setEditGroupName(group.name);
    setGroupMenuVisible(true);
  };

  const openEditGroupModal = () => {
    setGroupMenuVisible(false);
    setEditGroupModalVisible(true);
  };

  const getCategoriesByGroup = (groupId: string) => {
    return categories.filter((category) => category.groupId === groupId);
  };

  const getTargetForCategory = (categoryId: string) => {
    return targets.find((target) => target.categoryId === categoryId);
  };

  const getTargetDisplayText = (
    target: Target,
    currentBudgeted: number = 0
  ) => {
    const remainingNeeded = Math.max(0, target.targetAmount - currentBudgeted);

    // If target is fully funded, just say "Funded"
    if (remainingNeeded === 0) {
      return "Funded";
    }

    if (target.frequency === "monthly") {
      return `$${remainingNeeded.toFixed(2)} more needed by the ${
        target.dueDay
      }${getOrdinalSuffix(target.dueDay || 1)}`;
    } else if (target.frequency === "weekly") {
      return `$${remainingNeeded.toFixed(2)} more needed by ${getDayOfWeekName(
        target.dueDay || 1
      )}`;
    } else if (target.frequency === "custom" && target.dueDate) {
      // Custom target with date-aware monthly calculation
      const today = new Date();
      const dueDate = new Date(target.dueDate);

      // Check if date parsing was successful
      if (isNaN(dueDate.getTime())) {
        return `$${remainingNeeded.toFixed(2)} more needed by ${
          target.dueDate
        }`;
      }

      // Calculate months remaining (including current month)
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const dueMonth = dueDate.getMonth();
      const dueYear = dueDate.getFullYear();

      const monthsRemaining =
        (dueYear - currentYear) * 12 + (dueMonth - currentMonth) + 1;

      if (monthsRemaining <= 0) {
        // Target is overdue
        return `$${remainingNeeded.toFixed(2)} overdue by ${target.dueDate}`;
      } else if (monthsRemaining === 1) {
        // Last month - need full remaining amount
        return `$${remainingNeeded.toFixed(2)} more needed this month`;
      } else {
        // Calculate monthly amount needed
        const monthlyAmount = remainingNeeded / monthsRemaining;
        return `$${monthlyAmount.toFixed(2)} more needed this month`;
      }
    } else {
      return `$${remainingNeeded.toFixed(2)} more needed by ${target.dueDate}`;
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const toggleGroupCollapse = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const selectDueDay = (day: string) => {
    setTargetDueDay(day);
    setTargetDueDayDropdownVisible(false);
  };

  const validateCustomDate = (dateString: string) => {
    // Check if it matches MM/DD/YYYY format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);

    if (!match) return false;

    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const year = parseInt(match[3]);

    // Validate ranges
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    return true;
  };

  const handleCustomDateChange = (text: string) => {
    setTargetDueDay(text);
  };

  const calculateCategorySpending = (categoryId: string) => {
    return transactions
      .filter((tx) => tx.categoryId === categoryId)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const calculateRemainingBudget = (category: Category) => {
    const spending = calculateCategorySpending(category.id);
    return category.budgeted - spending;
  };

  const enterReorderMode = () => {
    console.log("Entering reorder mode...");

    // Create reorder data from groups and categories
    const reorderItems: Array<{
      id: string;
      name: string;
      type: "group" | "category";
      groupId?: string;
      order: number;
    }> = [];

    // Add groups first
    categoryGroups.forEach((group, index) => {
      reorderItems.push({
        id: group.id,
        name: group.name,
        type: "group",
        order: index,
      });

      // Add categories in this group
      const groupCategories = getCategoriesByGroup(group.id);
      groupCategories.forEach((category, catIndex) => {
        reorderItems.push({
          id: category.id,
          name: category.name,
          type: "category",
          groupId: group.id,
          order: catIndex,
        });
      });
    });

    console.log("Reorder items:", reorderItems);
    setReorderData(reorderItems);
    setReorderMode(true);
    console.log("Reorder mode set to true");
  };

  const exitReorderMode = () => {
    setReorderMode(false);
    setReorderData([]);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newReorderData = [...reorderData];
    const [movedItem] = newReorderData.splice(fromIndex, 1);
    newReorderData.splice(toIndex, 0, movedItem);

    // Update order numbers
    newReorderData.forEach((item, index) => {
      item.order = index;
    });

    setReorderData(newReorderData);
  };

  const saveReorderChanges = () => {
    // Apply the reorder changes to the actual data
    const newGroups: CategoryGroup[] = [];
    const newCategories: Category[] = [];

    let currentGroupId: string | null = null;

    reorderData.forEach((item) => {
      if (item.type === "group") {
        // Find the original group and update its order
        const originalGroup = categoryGroups.find((g) => g.id === item.id);
        if (originalGroup) {
          newGroups.push({
            ...originalGroup,
            order: item.order,
          });
          currentGroupId = item.id;
        }
      } else if (item.type === "category" && currentGroupId) {
        // Find the original category and update its group and order
        const originalCategory = categories.find((c) => c.id === item.id);
        if (originalCategory) {
          newCategories.push({
            ...originalCategory,
            groupId: currentGroupId,
            order: item.order,
          });
        }
      }
    });

    // Update state
    setCategoryGroups(newGroups);
    setCategories(newCategories);

    // Exit reorder mode
    exitReorderMode();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">{planName}</ThemedText>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => {
                console.log("Edit button pressed");
                setEditPlanModalVisible(true);
              }}
              style={styles.editButton}
            >
              <ThemedText style={styles.editButtonText}>Edit</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                console.log("Plus button pressed");
                setModalVisible(true);
              }}
              style={styles.addButton}
            >
              <ThemedText style={{ fontSize: 28 }}>＋</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : (
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              if (mainEditAmountFocused) {
                setSelectedCategoryForMainEdit(null);
                setMainEditAmountFocused(false);
                setMainEditPendingAmount("");
                setMainEditPadMemory(null);
                setMainEditPadOperator(undefined);

                // Force a small delay to ensure the number pad is fully removed before allowing scrolling
                setTimeout(() => {
                  if (mainPlanScrollViewRef.current) {
                    // Trigger a small scroll to refresh the ScrollView's touch handling
                    mainPlanScrollViewRef.current.scrollTo({
                      y: 0,
                      animated: false,
                    });
                  }
                }, 50);
              }
            }}
          >
            <ScrollView
              ref={mainPlanScrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              onLayout={(event) => {
                setMainPlanScrollViewHeight(event.nativeEvent.layout.height);
              }}
            >
              {/* Ready to Assign Section */}
              {calculateReadyToAssign() > 0 && (
                <TouchableOpacity
                  style={styles.readyToAssignSection}
                  onPress={openAssignMoneyModal}
                >
                  <View style={styles.readyToAssignContent}>
                    <ThemedText style={styles.readyToAssignAmount}>
                      ${calculateReadyToAssign().toFixed(2)}
                    </ThemedText>
                    <ThemedText style={styles.readyToAssignText}>
                      Ready to Assign ›
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}

              {/* Assigned Too Much Section */}
              {calculateReadyToAssign() < -0.01 && (
                <TouchableOpacity
                  style={styles.assignedTooMuchSection}
                  onPress={openAssignedTooMuchModal}
                >
                  <View style={styles.assignedTooMuchContent}>
                    <ThemedText style={styles.assignedTooMuchAmount}>
                      ${calculateReadyToAssign().toFixed(2)}
                    </ThemedText>
                    <ThemedText style={styles.assignedTooMuchText}>
                      Assigned Too Much ›
                    </ThemedText>
                    <ThemedText style={styles.assignedTooMuchSubtext}>
                      Subtract funds until you reach zero
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}

              {/* Category Groups */}
              {categoryGroups
                .sort((a, b) => a.order - b.order)
                .map((group: CategoryGroup) => {
                  const groupCategories = getCategoriesByGroup(group.id);
                  const totalBudgeted = groupCategories.reduce(
                    (sum, cat) => sum + cat.budgeted,
                    0
                  );
                  const isCollapsed = collapsedGroups.has(group.id);

                  return (
                    <View key={group.id} style={styles.groupSection}>
                      <TouchableOpacity
                        style={styles.groupHeader}
                        onPress={() => toggleGroupCollapse(group.id)}
                      >
                        <View style={styles.groupHeaderLeft}>
                          <ThemedText style={styles.groupArrow}>
                            {isCollapsed ? "▶" : "▼"}
                          </ThemedText>
                          <ThemedText style={styles.groupName}>
                            {group.name}
                          </ThemedText>
                        </View>
                        <View style={styles.groupHeaderRight}>
                          <View style={styles.groupTotalsContainer}>
                            <View style={styles.groupTotalColumn}>
                              <ThemedText style={styles.groupTotalLabel}>
                                {group.id === "credit-card-payments"
                                  ? "Available for Payment"
                                  : "Available to Spend"}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                      {!isCollapsed && (
                        <>
                          {groupCategories.length === 0 ? (
                            <ThemedText style={styles.emptyText}>
                              No categories yet
                            </ThemedText>
                          ) : (
                            groupCategories.map((category) => {
                              const target = getTargetForCategory(category.id);
                              const spending = calculateCategorySpending(
                                category.id
                              );
                              const available = category.budgeted - spending;

                              return (
                                <TouchableOpacity
                                  key={category.id}
                                  ref={(ref) => {
                                    categoryRefs.current[category.id] = ref;
                                  }}
                                  style={styles.categoryItem}
                                  onPress={() =>
                                    selectCategoryForMainEdit(category)
                                  }
                                >
                                  <View style={styles.categoryInfo}>
                                    <View style={styles.categoryLeft}>
                                      <ThemedText style={styles.categoryName}>
                                        {category.name}
                                      </ThemedText>
                                      {target &&
                                        group.id !== "credit-card-payments" && (
                                          <ThemedText
                                            style={styles.categoryTarget}
                                          >
                                            {getTargetDisplayText(
                                              target,
                                              category.budgeted
                                            )}
                                          </ThemedText>
                                        )}
                                    </View>
                                    <View
                                      style={styles.categoryAmountContainer}
                                    >
                                      {selectedCategoryForMainEdit?.id ===
                                      category.id ? (
                                        <View
                                          style={styles.categoryAmountStack}
                                        >
                                          <ThemedText
                                            style={[
                                              styles.categoryAmount,
                                              styles.categoryAmountSelected,
                                            ]}
                                          >
                                            {mainEditPadOperator
                                              ? `$${category.budgeted.toFixed(
                                                  2
                                                )}`
                                              : mainEditPendingAmount
                                              ? getFormattedPendingAmount(
                                                  mainEditPendingAmount
                                                )
                                              : hasStartedEditing
                                              ? "$0.00"
                                              : `$${category.budgeted.toFixed(
                                                  2
                                                )}`}
                                          </ThemedText>
                                          {mainEditPadOperator && (
                                            <ThemedText
                                              style={
                                                styles.assignMoneyCategoryOperationText
                                              }
                                            >
                                              {mainEditPadOperator === "add"
                                                ? "+"
                                                : "-"}
                                              {mainEditPendingAmount
                                                ? getFormattedPendingAmount(
                                                    mainEditPendingAmount
                                                  )
                                                : "$0.00"}
                                            </ThemedText>
                                          )}
                                        </View>
                                      ) : (
                                        <ThemedText
                                          style={styles.categoryAmount}
                                        >
                                          ${available.toFixed(2)}
                                        </ThemedText>
                                      )}
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              );
                            })
                          )}
                        </>
                      )}
                    </View>
                  );
                })}
            </ScrollView>
          </TouchableOpacity>
        )}

        {/* Main Plan Number Pad */}
        {mainEditAmountFocused && selectedCategoryForMainEdit && (
          <View style={styles.mainEditNumberPadContainer}>
            <CustomNumberPad
              onPress={handleMainEditPadPress}
              onBackspace={handleMainEditPadBackspace}
              onAdd={handleMainEditPadAdd}
              onSubtract={handleMainEditPadSubtract}
              onEquals={() => {}} // Not used
              onDone={handleMainEditPadDone}
            />
          </View>
        )}

        {/* Assign Money Modal */}
        <Modal
          visible={assignMoneyModalVisible}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
            <View style={styles.assignMoneyContainer}>
              <View style={styles.assignMoneyHeader}>
                <TouchableOpacity
                  onPress={() => setAssignMoneyModalVisible(false)}
                  style={styles.assignMoneyCancelButton}
                >
                  <ThemedText style={styles.assignMoneyCancelButtonText}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.assignMoneyTitle}>
                  Assign Money
                </ThemedText>
              </View>

              {/* Ready to Assign Section */}
              <View style={styles.assignMoneyReadySection}>
                <ThemedText style={styles.assignMoneyReadyAmount}>
                  ${calculateReadyToAssign().toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.assignMoneyReadyText}>
                  Ready to Assign
                </ThemedText>
              </View>

              {/* Categories List */}
              <ScrollView
                ref={assignMoneyScrollViewRef}
                style={styles.assignMoneyScrollView}
                contentContainerStyle={styles.assignMoneyScrollViewContent}
                onLayout={(event) => {
                  setAssignMoneyScrollViewHeight(
                    event.nativeEvent.layout.height
                  );
                }}
              >
                {categoryGroups
                  .sort((a, b) => a.order - b.order)
                  .map((group: CategoryGroup) => {
                    const groupCategories = getCategoriesByGroup(group.id);
                    const totalAssigned = groupCategories.reduce(
                      (sum, cat) => sum + cat.budgeted,
                      0
                    );

                    return (
                      <View
                        key={group.id}
                        style={styles.assignMoneyGroupSection}
                      >
                        <View style={styles.assignMoneyGroupHeader}>
                          <ThemedText style={styles.assignMoneyGroupName}>
                            {group.name}
                          </ThemedText>
                          <ThemedText style={styles.assignMoneyGroupAssigned}>
                            Assigned
                          </ThemedText>
                        </View>
                        <View style={styles.assignMoneyGroupAssignedAmount}>
                          <ThemedText
                            style={styles.assignMoneyGroupAssignedAmountText}
                          >
                            ${totalAssigned.toFixed(2)}
                          </ThemedText>
                        </View>

                        {groupCategories.map((category) => {
                          const target = getTargetForCategory(category.id);
                          const spending = calculateCategorySpending(
                            category.id
                          );
                          const available = category.budgeted - spending;

                          return (
                            <TouchableOpacity
                              key={category.id}
                              ref={(ref) => {
                                categoryRefs.current[category.id] = ref;
                              }}
                              style={styles.assignMoneyCategoryItem}
                              onPress={() =>
                                selectCategoryForAssignment(category)
                              }
                            >
                              <View style={styles.assignMoneyCategoryInfo}>
                                <View style={styles.assignMoneyCategoryLeft}>
                                  <ThemedText
                                    style={styles.assignMoneyCategoryName}
                                  >
                                    {category.name}
                                  </ThemedText>
                                  {target &&
                                    group.id !== "credit-card-payments" && (
                                      <ThemedText
                                        style={styles.assignMoneyCategoryTarget}
                                      >
                                        {getTargetDisplayText(
                                          target,
                                          category.budgeted
                                        )}
                                      </ThemedText>
                                    )}
                                </View>
                                <View
                                  style={
                                    styles.assignMoneyCategoryAmountContainer
                                  }
                                >
                                  {selectedCategoryForAssignment?.id ===
                                    category.id && assignmentAmountFocused ? (
                                    <View
                                      style={
                                        styles.assignMoneyCategoryAmountStack
                                      }
                                    >
                                      <ThemedText
                                        style={[
                                          styles.assignMoneyCategoryAmount,
                                          styles.assignMoneyCategoryAmountActive,
                                        ]}
                                      >
                                        {assignmentPadOperator
                                          ? `$${category.budgeted.toFixed(2)}`
                                          : assignmentPendingAmount
                                          ? getFormattedPendingAmount(
                                              assignmentPendingAmount
                                            )
                                          : `$${category.budgeted.toFixed(2)}`}
                                      </ThemedText>
                                      {assignmentPadOperator && (
                                        <ThemedText
                                          style={
                                            styles.assignMoneyCategoryOperationText
                                          }
                                        >
                                          {assignmentPadOperator === "add"
                                            ? "+"
                                            : "-"}
                                          {assignmentPendingAmount
                                            ? getFormattedPendingAmount(
                                                assignmentPendingAmount
                                              )
                                            : "$0.00"}
                                        </ThemedText>
                                      )}
                                    </View>
                                  ) : (
                                    <ThemedText
                                      style={styles.assignMoneyCategoryAmount}
                                    >
                                      ${available.toFixed(2)}
                                    </ThemedText>
                                  )}
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
              </ScrollView>

              {/* Assignment Number Pad - Fixed at bottom */}
              {assignmentAmountFocused && (
                <View style={styles.assignMoneyNumberPadContainer}>
                  <CustomNumberPad
                    onPress={handleAssignmentPadPress}
                    onBackspace={handleAssignmentPadBackspace}
                    onAdd={handleAssignmentPadAdd}
                    onSubtract={handleAssignmentPadSubtract}
                    onEquals={handleAssignmentPadEquals}
                    onDone={handleAssignmentPadDone}
                  />
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Add Category Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ThemedText type="subtitle">Add Category</ThemedText>
              <TextInput
                placeholder="Category Name"
                value={categoryName}
                onChangeText={setCategoryName}
                style={styles.input}
              />
              <TextInput
                placeholder="Budgeted Amount"
                value={budgeted}
                onChangeText={setBudgeted}
                style={styles.input}
                keyboardType="numeric"
              />
              <View style={styles.pickerContainer}>
                <ThemedText style={styles.pickerLabel}>Group:</ThemedText>
                <View style={styles.groupButtons}>
                  {categoryGroups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.groupButton,
                        selectedGroup === group.id &&
                          styles.selectedGroupButton,
                      ]}
                      onPress={() => setSelectedGroup(group.id)}
                    >
                      <ThemedText
                        style={[
                          styles.groupButtonText,
                          selectedGroup === group.id &&
                            styles.selectedGroupButtonText,
                        ]}
                      >
                        {group.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Button title="Add" onPress={addCategory} />
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                color="gray"
              />
            </View>
          </View>
        </Modal>

        {/* Assigned Too Much Modal */}
        <Modal
          visible={assignedTooMuchModalVisible}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
            <View style={styles.assignedTooMuchContainer}>
              <View style={styles.assignedTooMuchHeader}>
                <TouchableOpacity
                  onPress={() => setAssignedTooMuchModalVisible(false)}
                  style={styles.assignedTooMuchCancelButton}
                >
                  <ThemedText style={styles.assignedTooMuchCancelButtonText}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.assignedTooMuchTitle}>
                  Subtract Money
                </ThemedText>
              </View>

              {/* Over-assigned Warning Section */}
              <View style={styles.assignedTooMuchWarningSection}>
                <ThemedText style={styles.assignedTooMuchWarningAmount}>
                  ${Math.abs(calculateReadyToAssign()).toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.assignedTooMuchWarningText}>
                  Assigning more than you have
                </ThemedText>
                <ThemedText style={styles.assignedTooMuchWarningSubtext}>
                  Subtract funds until you reach zero
                </ThemedText>
              </View>

              {/* Categories List for Subtraction */}
              <ScrollView
                style={styles.assignedTooMuchScrollView}
                contentContainerStyle={styles.assignedTooMuchScrollViewContent}
              >
                {categoryGroups
                  .sort((a, b) => a.order - b.order)
                  .map((group: CategoryGroup) => {
                    const groupCategories = getCategoriesByGroup(group.id);
                    const totalAssigned = groupCategories.reduce(
                      (sum, cat) => sum + cat.budgeted,
                      0
                    );

                    if (totalAssigned === 0) return null; // Only show groups with assigned money

                    return (
                      <View
                        key={group.id}
                        style={styles.assignedTooMuchGroupSection}
                      >
                        <View style={styles.assignedTooMuchGroupHeader}>
                          <ThemedText style={styles.assignedTooMuchGroupName}>
                            {group.name}
                          </ThemedText>
                          <ThemedText style={styles.assignedTooMuchGroupTotal}>
                            Assigned ${totalAssigned.toFixed(2)}
                          </ThemedText>
                        </View>

                        {groupCategories.map((category) => {
                          if (category.budgeted === 0) return null; // Only show categories with assigned money

                          return (
                            <TouchableOpacity
                              key={category.id}
                              style={[
                                styles.assignedTooMuchCategoryItem,
                                selectedCategoryForSubtraction?.id ===
                                  category.id &&
                                  styles.assignedTooMuchCategoryItemSelected,
                              ]}
                              onPress={() =>
                                selectCategoryForSubtraction(category)
                              }
                            >
                              <View style={styles.assignedTooMuchCategoryInfo}>
                                <View
                                  style={styles.assignedTooMuchCategoryLeft}
                                >
                                  <ThemedText
                                    style={styles.assignedTooMuchCategoryName}
                                  >
                                    {category.name}
                                  </ThemedText>
                                </View>
                                <View
                                  style={
                                    styles.assignedTooMuchCategoryAmountContainer
                                  }
                                >
                                  <ThemedText
                                    style={[
                                      styles.assignedTooMuchCategoryAmount,
                                      selectedCategoryForSubtraction?.id ===
                                        category.id &&
                                        styles.assignedTooMuchCategoryAmountSelected,
                                    ]}
                                  >
                                    {selectedCategoryForSubtraction?.id ===
                                      category.id && subtractionPadOperator
                                      ? `$${category.budgeted.toFixed(2)}`
                                      : selectedCategoryForSubtraction?.id ===
                                          category.id &&
                                        subtractionPendingAmount
                                      ? `$${(
                                          parseFloat(subtractionPendingAmount) /
                                          100
                                        ).toFixed(2)}`
                                      : `$${category.budgeted.toFixed(2)}`}
                                  </ThemedText>
                                  {selectedCategoryForSubtraction?.id ===
                                    category.id &&
                                    subtractionPadOperator && (
                                      <ThemedText
                                        style={
                                          styles.assignedTooMuchCategoryOperationText
                                        }
                                      >
                                        - $
                                        {subtractionPendingAmount
                                          ? (
                                              parseFloat(
                                                subtractionPendingAmount
                                              ) / 100
                                            ).toFixed(2)
                                          : "0.00"}
                                      </ThemedText>
                                    )}
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
              </ScrollView>

              {/* Number Pad for Subtraction */}
              {subtractionAmountFocused && selectedCategoryForSubtraction && (
                <View style={styles.subtractionNumberPadContainer}>
                  <CustomNumberPad
                    onPress={handleSubtractionPadPress}
                    onBackspace={handleSubtractionPadBackspace}
                    onAdd={() => {}} // Not used for subtraction
                    onSubtract={handleSubtractionPadSubtract}
                    onEquals={() => {}} // Not used
                    onDone={handleSubtractionPadDone}
                  />
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Edit Plan Modal */}
        <Modal
          visible={editPlanModalVisible}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
            <ThemedView style={styles.editPlanContainer}>
              <View style={styles.editPlanHeader}>
                <TouchableOpacity
                  onPress={() => setEditPlanModalVisible(false)}
                  style={styles.backButton}
                >
                  <ThemedText style={styles.backButtonText}>← Plan</ThemedText>
                </TouchableOpacity>
                <ThemedText type="title" style={styles.editPlanTitle}>
                  Edit Plan
                </ThemedText>
              </View>

              <ScrollView
                style={styles.editPlanScrollView}
                contentContainerStyle={styles.editPlanScrollViewContent}
              >
                <View style={styles.editPlanContent}>
                  <View style={styles.editPlanButtons}>
                    <TouchableOpacity
                      style={styles.newGroupButton}
                      onPress={() => {
                        console.log("New Group button pressed");
                        setNewGroupModalVisible(true);
                      }}
                    >
                      <ThemedText style={styles.newGroupButtonIcon}>
                        📁
                      </ThemedText>
                      <ThemedText style={styles.newGroupButtonText}>
                        New Group
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reorderButton}
                      onPress={enterReorderMode}
                    >
                      <ThemedText style={styles.reorderButtonIcon}>
                        ↕
                      </ThemedText>
                      <ThemedText style={styles.reorderButtonText}>
                        Reorder
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Display existing groups */}
                  {categoryGroups.map((group) => {
                    const groupCategories = getCategoriesByGroup(group.id);
                    return (
                      <View key={group.id} style={styles.editPlanGroup}>
                        <View style={styles.editPlanGroupHeader}>
                          <ThemedText style={styles.editPlanGroupName}>
                            {group.name}
                          </ThemedText>
                          <View style={styles.editPlanGroupActions}>
                            <TouchableOpacity
                              style={styles.editPlanGroupAction}
                              onPress={() => openNewCategoryModal(group)}
                            >
                              <ThemedText
                                style={styles.editPlanGroupActionIcon}
                              >
                                ＋
                              </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.editPlanGroupAction}
                              onPress={() => openGroupMenu(group)}
                            >
                              <ThemedText
                                style={styles.editPlanGroupActionIcon}
                              >
                                ⋯
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {/* Display categories in this group */}
                        {groupCategories.map((category) => {
                          const target = getTargetForCategory(category.id);
                          return (
                            <View
                              key={category.id}
                              style={styles.editPlanCategory}
                            >
                              <View style={styles.editPlanCategoryInfo}>
                                <ThemedText style={styles.editPlanCategoryName}>
                                  {category.name}
                                </ThemedText>
                                {target &&
                                  group.id !== "credit-card-payments" && (
                                    <ThemedText
                                      style={styles.editPlanCategoryTarget}
                                    >
                                      {getTargetDisplayText(
                                        target,
                                        category.budgeted
                                      )}
                                    </ThemedText>
                                  )}
                              </View>
                              <View style={styles.editPlanCategoryActions}>
                                {group.id === "credit-card-payments" ? (
                                  <View style={styles.creditCardIndicator}>
                                    <ThemedText style={styles.creditCardText}>
                                      Payment Category
                                    </ThemedText>
                                  </View>
                                ) : getTargetForCategory(category.id) ? (
                                  <TouchableOpacity
                                    style={styles.targetAmountDisplay}
                                    onPress={() => openTargetModal(category)}
                                  >
                                    <ThemedText style={styles.targetAmountText}>
                                      $
                                      {getTargetForCategory(
                                        category.id
                                      )?.targetAmount.toFixed(2)}
                                    </ThemedText>
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.addTargetButton}
                                    onPress={() => openTargetModal(category)}
                                  >
                                    <ThemedText
                                      style={styles.addTargetButtonIcon}
                                    >
                                      ＋
                                    </ThemedText>
                                    <ThemedText
                                      style={styles.addTargetButtonText}
                                    >
                                      Add Target
                                    </ThemedText>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* New Group Modal */}
              <Modal
                visible={newGroupModalVisible}
                animationType="slide"
                transparent={false}
              >
                <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
                  <View style={styles.targetModalContainer}>
                    <View style={styles.targetModalHeader}>
                      <TouchableOpacity
                        onPress={() => setNewGroupModalVisible(false)}
                        style={styles.targetCancelButton}
                      >
                        <ThemedText style={styles.targetCancelButtonText}>
                          Cancel
                        </ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.targetModalTitle}>
                        New Group
                      </ThemedText>
                    </View>
                    <View style={styles.targetModalContent}>
                      <TextInput
                        style={styles.newGroupInput}
                        placeholder="Group Name"
                        placeholderTextColor="#888"
                        value={newGroupName}
                        onChangeText={setNewGroupName}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.continueButton}
                        onPress={addNewGroup}
                      >
                        <ThemedText style={styles.continueButtonText}>
                          Add Group
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </SafeAreaView>
              </Modal>

              {/* Group Menu Modal */}
              <Modal
                visible={groupMenuVisible}
                animationType="fade"
                transparent
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setGroupMenuVisible(false)}
                >
                  <View style={styles.groupMenuContainer}>
                    <TouchableOpacity
                      style={styles.groupMenuItem}
                      onPress={openEditGroupModal}
                    >
                      <ThemedText style={styles.groupMenuItemText}>
                        Edit Group Name
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.groupMenuItem}
                      onPress={handleDeleteGroup}
                    >
                      <ThemedText style={styles.groupMenuItemText}>
                        Delete Group
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Edit Group Modal */}
              <Modal
                visible={editGroupModalVisible}
                animationType="slide"
                transparent
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.newGroupModalContainer}>
                    <View style={styles.newGroupModalHeader}>
                      <ThemedText
                        type="subtitle"
                        style={styles.newGroupModalTitle}
                      >
                        Edit Group
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => setEditGroupModalVisible(false)}
                        style={styles.closeButton}
                      >
                        <ThemedText style={styles.closeButtonText}>
                          ✕
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.newGroupInput}
                      placeholder="Group Name"
                      placeholderTextColor="#888"
                      value={editGroupName}
                      onChangeText={setEditGroupName}
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={handleEditGroup}
                    >
                      <ThemedText style={styles.continueButtonText}>
                        Save Changes
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* New Category Modal */}
              <Modal
                visible={newCategoryModalVisible}
                animationType="slide"
                transparent
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.newGroupModalContainer}>
                    <View style={styles.newGroupModalHeader}>
                      <ThemedText
                        type="subtitle"
                        style={styles.newGroupModalTitle}
                      >
                        New Category in {selectedGroupForCategory?.name}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => setNewCategoryModalVisible(false)}
                        style={styles.closeButton}
                      >
                        <ThemedText style={styles.closeButtonText}>
                          ✕
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.newGroupInput}
                      placeholder="Category Name"
                      placeholderTextColor="#888"
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={addNewCategory}
                    >
                      <ThemedText style={styles.continueButtonText}>
                        Add Category
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Target Modal */}
              <Modal
                visible={targetModalVisible}
                animationType="slide"
                transparent={false}
              >
                <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
                  <View style={styles.targetModalContainer}>
                    <View style={styles.targetModalHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          setTargetModalVisible(false);
                          setTargetAmountFocused(false);
                        }}
                        style={styles.targetCancelButton}
                      >
                        <ThemedText style={styles.targetCancelButtonText}>
                          Cancel
                        </ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.targetModalTitle}>
                        {selectedCategoryForTarget &&
                        getTargetForCategory(selectedCategoryForTarget.id)
                          ? `Edit Target - ${selectedCategoryForTarget.name}`
                          : `Add Target - ${selectedCategoryForTarget?.name}`}
                      </ThemedText>
                    </View>

                    <ScrollView style={styles.targetModalContent}>
                      {/* Frequency Selector */}
                      <View style={styles.frequencySelector}>
                        {(["weekly", "monthly", "custom"] as const).map(
                          (freq) => (
                            <TouchableOpacity
                              key={freq}
                              style={[
                                styles.frequencyButton,
                                targetFrequency === freq &&
                                  styles.frequencyButtonActive,
                              ]}
                              onPress={() => setTargetFrequency(freq)}
                            >
                              <ThemedText
                                style={[
                                  styles.frequencyButtonText,
                                  targetFrequency === freq &&
                                    styles.frequencyButtonTextActive,
                                ]}
                              >
                                {freq.charAt(0).toUpperCase() + freq.slice(1)}
                              </ThemedText>
                            </TouchableOpacity>
                          )
                        )}
                      </View>

                      {/* Target Amount */}
                      <View style={styles.targetSection}>
                        <View style={styles.targetSectionHeader}>
                          <ThemedText style={styles.targetSectionIcon}>
                            💰
                          </ThemedText>
                          <ThemedText style={styles.targetSectionLabel}>
                            I need
                          </ThemedText>
                        </View>
                        <TouchableOpacity
                          style={styles.targetAmountInput}
                          onPress={() => {
                            setTargetAmountFocused(true);
                          }}
                        >
                          <ThemedText style={styles.targetModalAmountText}>
                            {targetAmountFocused && targetPendingAmount
                              ? getFormattedPendingAmount(targetPendingAmount)
                              : targetAmount}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>

                      {/* Due Date */}
                      <View style={styles.targetSection}>
                        <View style={styles.targetSectionHeader}>
                          <ThemedText style={styles.targetSectionIcon}>
                            📅
                          </ThemedText>
                          <ThemedText style={styles.targetSectionLabel}>
                            By
                          </ThemedText>
                        </View>
                        <View style={styles.targetDueDayContainer}>
                          {targetFrequency === "monthly" ? (
                            <View style={styles.dropdownContainer}>
                              <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() =>
                                  setTargetDueDayDropdownVisible(true)
                                }
                              >
                                <ThemedText style={styles.dropdownButtonText}>
                                  {targetDueDay}
                                </ThemedText>
                                <ThemedText style={styles.dropdownArrow}>
                                  ▼
                                </ThemedText>
                              </TouchableOpacity>
                            </View>
                          ) : targetFrequency === "weekly" ? (
                            <View style={styles.dropdownContainer}>
                              <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() =>
                                  setTargetDueDayDropdownVisible(true)
                                }
                              >
                                <ThemedText style={styles.dropdownButtonText}>
                                  {getDayOfWeekName(parseInt(targetDueDay))}
                                </ThemedText>
                                <ThemedText style={styles.dropdownArrow}>
                                  ▼
                                </ThemedText>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TextInput
                              style={[
                                styles.targetDueDayInput,
                                !validateCustomDate(targetDueDay) &&
                                  targetDueDay.length > 0 &&
                                  styles.invalidInput,
                              ]}
                              value={targetDueDay}
                              onChangeText={handleCustomDateChange}
                              placeholder="MM/DD/YYYY"
                              placeholderTextColor="#888"
                            />
                          )}
                          <ThemedText style={styles.targetDueDayLabel}>
                            {targetFrequency === "monthly"
                              ? "of the month"
                              : targetFrequency === "weekly"
                              ? "of the week"
                              : ""}{" "}
                            {/* Empty for custom */}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Next Month Behavior */}
                      <View style={styles.targetSection}>
                        <View style={styles.targetSectionHeader}>
                          <ThemedText style={styles.targetSectionIcon}>
                            🔄
                          </ThemedText>
                          <ThemedText style={styles.targetSectionLabel}>
                            Next month I want to
                          </ThemedText>
                        </View>
                        <View style={styles.nextMonthToggleContainer}>
                          <TouchableOpacity
                            style={[
                              styles.nextMonthToggleButton,
                              targetNextMonthBehavior === "setAside" &&
                                styles.nextMonthToggleButtonActive,
                            ]}
                            onPress={() =>
                              setTargetNextMonthBehavior("setAside")
                            }
                          >
                            <ThemedText
                              style={[
                                styles.nextMonthToggleButtonText,
                                targetNextMonthBehavior === "setAside" &&
                                  styles.nextMonthToggleButtonTextActive,
                              ]}
                            >
                              Set aside another {targetAmount}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.nextMonthToggleButton,
                              targetNextMonthBehavior === "refill" &&
                                styles.nextMonthToggleButtonActive,
                            ]}
                            onPress={() => setTargetNextMonthBehavior("refill")}
                          >
                            <ThemedText
                              style={[
                                styles.nextMonthToggleButtonText,
                                targetNextMonthBehavior === "refill" &&
                                  styles.nextMonthToggleButtonTextActive,
                              ]}
                            >
                              Refill up to {targetAmount}
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ScrollView>

                    {/* Save Target Button */}
                    <TouchableOpacity
                      style={styles.saveTargetButton}
                      onPress={saveTarget}
                    >
                      <ThemedText style={styles.saveTargetButtonIcon}>
                        ✓
                      </ThemedText>
                      <ThemedText style={styles.saveTargetButtonText}>
                        Save Target
                      </ThemedText>
                    </TouchableOpacity>

                    {/* Custom Number Pad for Target Amount */}
                    {targetAmountFocused && (
                      <CustomNumberPad
                        onPress={handleTargetPadPress}
                        onBackspace={handleTargetPadBackspace}
                        onAdd={handleTargetPadAdd}
                        onSubtract={handleTargetPadSubtract}
                        onEquals={handleTargetPadEquals}
                        onDone={handleTargetPadDone}
                      />
                    )}

                    {/* Due Day Dropdown Modal */}
                    <Modal
                      visible={targetDueDayDropdownVisible}
                      transparent={true}
                      animationType="fade"
                    >
                      <TouchableOpacity
                        style={styles.dropdownOverlay}
                        activeOpacity={1}
                        onPress={() => setTargetDueDayDropdownVisible(false)}
                      >
                        <View style={styles.dropdownModal}>
                          <ScrollView
                            style={styles.dropdownScrollView}
                            showsVerticalScrollIndicator={true}
                          >
                            {targetFrequency === "monthly"
                              ? // Days 1-31 for monthly
                                Array.from({ length: 31 }, (_, i) => i + 1).map(
                                  (day) => (
                                    <TouchableOpacity
                                      key={day}
                                      style={styles.dropdownItem}
                                      onPress={() =>
                                        selectDueDay(day.toString())
                                      }
                                    >
                                      <ThemedText
                                        style={styles.dropdownItemText}
                                      >
                                        {day}
                                      </ThemedText>
                                    </TouchableOpacity>
                                  )
                                )
                              : targetFrequency === "weekly"
                              ? // Days of the week
                                [
                                  { value: "1", label: "Monday" },
                                  { value: "2", label: "Tuesday" },
                                  { value: "3", label: "Wednesday" },
                                  { value: "4", label: "Thursday" },
                                  { value: "5", label: "Friday" },
                                  { value: "6", label: "Saturday" },
                                  { value: "7", label: "Sunday" },
                                ].map((day) => (
                                  <TouchableOpacity
                                    key={day.value}
                                    style={styles.dropdownItem}
                                    onPress={() => selectDueDay(day.value)}
                                  >
                                    <ThemedText style={styles.dropdownItemText}>
                                      {day.label}
                                    </ThemedText>
                                  </TouchableOpacity>
                                ))
                              : null}
                          </ScrollView>
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </View>
                </SafeAreaView>
              </Modal>

              {/* Reorder Modal */}
              <Modal
                visible={reorderMode}
                animationType="slide"
                transparent={false}
              >
                <SafeAreaView style={{ flex: 1, backgroundColor: "#18191A" }}>
                  <View style={styles.reorderContainer}>
                    <View style={styles.reorderHeader}>
                      <TouchableOpacity
                        onPress={exitReorderMode}
                        style={styles.reorderCancelButton}
                      >
                        <ThemedText style={styles.reorderCancelButtonText}>
                          Cancel
                        </ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.reorderTitle}>
                        Reorder Categories
                      </ThemedText>
                      <TouchableOpacity
                        onPress={saveReorderChanges}
                        style={styles.reorderDoneButton}
                      >
                        <ThemedText style={styles.reorderDoneButtonText}>
                          Done
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.reorderScrollView}>
                      {reorderData.length === 0 ? (
                        <ThemedText style={styles.emptyText}>
                          No items to reorder
                        </ThemedText>
                      ) : (
                        reorderData.map((item, index) => (
                          <View key={item.id} style={styles.reorderItem}>
                            <View style={styles.reorderItemContent}>
                              <ThemedText style={styles.reorderItemText}>
                                {item.type === "group" ? "📁 " : "  "}
                                {item.name}
                              </ThemedText>
                              <View style={styles.reorderControls}>
                                <TouchableOpacity
                                  style={[
                                    styles.reorderControlButton,
                                    index === 0 &&
                                      styles.reorderControlButtonDisabled,
                                  ]}
                                  onPress={() =>
                                    moveItem(index, Math.max(0, index - 1))
                                  }
                                  disabled={index === 0}
                                >
                                  <ThemedText
                                    style={styles.reorderControlButtonText}
                                  >
                                    ↑
                                  </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[
                                    styles.reorderControlButton,
                                    index === reorderData.length - 1 &&
                                      styles.reorderControlButtonDisabled,
                                  ]}
                                  onPress={() =>
                                    moveItem(
                                      index,
                                      Math.min(
                                        reorderData.length - 1,
                                        index + 1
                                      )
                                    )
                                  }
                                  disabled={index === reorderData.length - 1}
                                >
                                  <ThemedText
                                    style={styles.reorderControlButtonText}
                                  >
                                    ↓
                                  </ThemedText>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </View>
                </SafeAreaView>
              </Modal>
            </ThemedView>
          </SafeAreaView>
        </Modal>
      </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 300, // Extra padding to ensure bottom categories can scroll above number pad
  },
  readyToAssignSection: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    padding: 15,
  },
  readyToAssignContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readyToAssignAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  readyToAssignText: {
    fontSize: 16,
    color: "#fff",
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  groupHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupArrow: {
    fontSize: 16,
    color: "#fff",
    marginRight: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  groupAvailable: {
    fontSize: 14,
    color: "#888",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    padding: 20,
  },
  categoryItem: {
    backgroundColor: "#2a2a2a",
    marginHorizontal: 20,
    marginVertical: 2,
    borderRadius: 8,
    padding: 15,
  },
  categoryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryLeft: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  categoryTarget: {
    fontSize: 14,
    color: "#888",
  },
  categoryAmountContainer: {
    alignItems: "flex-end",
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
    marginBottom: 15,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 10,
  },
  groupButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  groupButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  selectedGroupButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  groupButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  selectedGroupButtonText: {
    fontWeight: "600",
  },
  editPlanContainer: {
    flex: 1,
    backgroundColor: "#18191A",
  },
  editPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  editPlanTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  editPlanScrollView: {
    flex: 1,
  },
  editPlanScrollViewContent: {
    paddingBottom: 50,
  },
  editPlanContent: {
    padding: 20,
  },
  editPlanButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  newGroupButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  newGroupButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  newGroupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reorderButton: {
    flex: 1,
    backgroundColor: "#666",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
  },
  reorderButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  reorderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  editPlanGroup: {
    marginBottom: 20,
  },
  editPlanGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  editPlanGroupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  editPlanGroupActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editPlanGroupAction: {
    backgroundColor: "#007AFF",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  editPlanGroupActionIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  editPlanCategory: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  editPlanCategoryInfo: {
    flex: 1,
  },
  editPlanCategoryName: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  editPlanCategoryTarget: {
    fontSize: 14,
    color: "#888",
  },
  editPlanCategoryActions: {
    alignItems: "flex-end",
  },
  targetAmountDisplay: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  targetAmountText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  addTargetButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  addTargetButtonIcon: {
    color: "#fff",
    fontSize: 14,
    marginRight: 5,
  },
  addTargetButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  targetModalContainer: {
    flex: 1,
    backgroundColor: "#18191A",
  },
  targetModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  targetCancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  targetCancelButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  targetModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  targetModalContent: {
    flex: 1,
    padding: 20,
  },
  newGroupInput: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  groupMenuContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 10,
    minWidth: 200,
  },
  groupMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  groupMenuItemText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  newGroupModalContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  newGroupModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  newGroupModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
  },
  frequencySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  frequencyButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#333",
  },
  frequencyButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  frequencyButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  frequencyButtonTextActive: {
    fontWeight: "bold",
  },
  targetSection: {
    marginBottom: 25,
  },
  targetSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  targetSectionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  targetSectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  targetAmountInput: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  targetModalAmountText: {
    fontSize: 16,
    color: "#fff",
  },
  targetDueDayContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownContainer: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    marginRight: 10,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#fff",
  },
  targetDueDayInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
    marginRight: 10,
  },
  invalidInput: {
    borderColor: "#F44336",
  },
  targetDueDayLabel: {
    fontSize: 14,
    color: "#888",
  },
  nextMonthToggleContainer: {
    flexDirection: "row",
    gap: 10,
  },
  nextMonthToggleButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: "center",
  },
  nextMonthToggleButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  nextMonthToggleButtonText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  nextMonthToggleButtonTextActive: {
    fontWeight: "bold",
  },
  saveTargetButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  saveTargetButtonIcon: {
    color: "#fff",
    fontSize: 18,
    marginRight: 8,
  },
  saveTargetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    maxHeight: 300,
    width: "80%",
    maxWidth: 300,
  },
  dropdownScrollView: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  reorderContainer: {
    flex: 1,
    backgroundColor: "#18191A",
  },
  reorderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  reorderCancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  reorderCancelButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  reorderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  reorderDoneButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reorderDoneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reorderScrollView: {
    flex: 1,
    padding: 20,
  },
  reorderItem: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
  },
  reorderItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reorderItemText: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
  },
  reorderControls: {
    flexDirection: "row",
    gap: 10,
  },
  reorderControlButton: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  reorderControlButtonDisabled: {
    backgroundColor: "#666",
  },
  reorderControlButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Assign Money Modal Styles
  assignMoneyContainer: {
    flex: 1,
    backgroundColor: "#18191A",
  },
  assignMoneyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  assignMoneyCancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  assignMoneyCancelButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  assignMoneyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  assignMoneyReadySection: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  assignMoneyReadyAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  assignMoneyReadyText: {
    fontSize: 16,
    color: "#fff",
  },
  assignMoneyScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  assignMoneyScrollViewContent: {
    paddingBottom: 500, // Excessive padding to test auto-scroll
  },
  assignMoneyGroupSection: {
    marginBottom: 20,
  },
  assignMoneyGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  assignMoneyGroupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  assignMoneyGroupAssigned: {
    fontSize: 14,
    color: "#888",
  },
  assignMoneyGroupAssignedAmount: {
    paddingVertical: 5,
  },
  assignMoneyGroupAssignedAmountText: {
    fontSize: 14,
    color: "#888",
    textAlign: "right",
  },
  assignMoneyCategoryItem: {
    backgroundColor: "#2a2a2a",
    marginVertical: 2,
    borderRadius: 8,
    padding: 15,
  },
  assignMoneyCategoryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assignMoneyCategoryLeft: {
    flex: 1,
  },
  assignMoneyCategoryName: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
  },
  assignMoneyCategoryTarget: {
    fontSize: 12,
    color: "#888",
  },
  assignMoneyCategoryAmountContainer: {
    alignItems: "flex-end",
  },
  assignMoneyCategoryAmount: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  assignMoneyAmountDisplay: {
    backgroundColor: "#2a2a2a",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    padding: 15,
  },
  assignMoneyAmountLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  assignMoneyAmountInput: {
    backgroundColor: "#18191A",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  assignMoneyAmountText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  assignMoneySaveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  assignMoneySaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  assignMoneyNumberPadContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#18191A",
  },
  assignMoneyCategoryAmountActive: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  assignMoneyCategoryAmountStack: {
    alignItems: "flex-end",
  },
  assignMoneyCategoryOperationText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 2,
  },
  creditCardIndicator: {
    backgroundColor: "#666",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  creditCardText: {
    fontSize: 12,
    color: "#ccc",
    fontWeight: "500",
  },
  // Assigned Too Much Styles
  assignedTooMuchSection: {
    backgroundColor: "#D32F2F",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    padding: 20,
  },
  assignedTooMuchContent: {
    alignItems: "center",
  },
  assignedTooMuchAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  assignedTooMuchText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 5,
  },
  assignedTooMuchSubtext: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  assignedTooMuchContainer: {
    flex: 1,
    backgroundColor: "#18191A",
  },
  assignedTooMuchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  assignedTooMuchCancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  assignedTooMuchCancelButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  assignedTooMuchTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  assignedTooMuchWarningSection: {
    backgroundColor: "#D32F2F",
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  assignedTooMuchWarningAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  assignedTooMuchWarningText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 5,
  },
  assignedTooMuchWarningSubtext: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  assignedTooMuchScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  assignedTooMuchScrollViewContent: {
    paddingBottom: 50,
  },
  assignedTooMuchGroupSection: {
    marginBottom: 20,
  },
  assignedTooMuchGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginBottom: 10,
  },
  assignedTooMuchGroupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  assignedTooMuchGroupTotal: {
    fontSize: 14,
    color: "#888",
  },
  assignedTooMuchCategoryItem: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    marginBottom: 8,
    padding: 15,
  },
  assignedTooMuchCategoryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assignedTooMuchCategoryLeft: {
    flex: 1,
  },
  assignedTooMuchCategoryName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  assignedTooMuchCategoryAmountContainer: {
    alignItems: "flex-end",
  },
  assignedTooMuchCategoryAmount: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  assignedTooMuchCategoryItemSelected: {
    backgroundColor: "#007AFF",
  },
  assignedTooMuchCategoryAmountSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  assignedTooMuchCategoryOperationText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginTop: 2,
  },
  subtractionNumberPadContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#18191A",
  },
  // Main Plan Editing Styles
  categoryItemSelected: {
    backgroundColor: "#007AFF",
  },
  categoryAmountStack: {
    alignItems: "flex-end",
  },
  categoryAssigned: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  categoryAmountSelected: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  categoryOperationText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 2,
  },
  mainEditNumberPadContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#18191A",
    zIndex: 1000, // Ensure it's above other content
  },
  groupHeaderRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  groupTotalsContainer: {
    flexDirection: "row",
    gap: 20,
  },
  groupTotalColumn: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  groupTotalLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    marginBottom: 2,
    textAlign: "right",
  },
  groupTotalAmount: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
});
