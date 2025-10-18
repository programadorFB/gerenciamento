import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

const FinancialContext = createContext();

// Action types
const FINANCIAL_ACTIONS = {
  SET_BALANCE: 'SET_BALANCE',
  SET_LOADING: 'SET_LOADING',
  SET_REFRESHING: 'SET_REFRESHING',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  SET_OBJECTIVES: 'SET_OBJECTIVES',
  ADD_OBJECTIVE: 'ADD_OBJECTIVE',
  UPDATE_OBJECTIVE: 'UPDATE_OBJECTIVE',
  DELETE_OBJECTIVE: 'DELETE_OBJECTIVE',
  SET_ANALYTICS: 'SET_ANALYTICS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_DATA: 'RESET_DATA',
  // ✅ NOVOS: Para reset diário
  SET_DAILY_VALUES: 'SET_DAILY_VALUES',
  RESET_DAILY_VALUES: 'RESET_DAILY_VALUES',
  SET_LAST_RESET_DATE: 'SET_LAST_RESET_DATE',
};

// Initial state
const initialState = {
  transactions: [],
  balance: {
    current: 0,
    initial: 0,
  },
  objectives: [],
  analytics: {
    overview: null,
    monthly: [],
    performance: null,
    riskAnalysis: null,
  },
  categories: [],
  loading: false,
  refreshing: false,
  error: null,
  lastUpdated: null,
  // ✅ NOVOS: Valores diários
  dailyGains: 0,
  dailyLosses: 0,
  lastResetDate: null,
};

// Reducer
const financialReducer = (state, action) => {
  switch (action.type) {
    case FINANCIAL_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case FINANCIAL_ACTIONS.SET_REFRESHING:
      return {
        ...state,
        refreshing: action.payload,
      };

    case FINANCIAL_ACTIONS.SET_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload,
        lastUpdated: new Date().getTime(),
      };

    case FINANCIAL_ACTIONS.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        lastUpdated: new Date().getTime(),
      };

    case FINANCIAL_ACTIONS.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map(tx =>
          tx.id === action.payload.id ? action.payload : tx
        ),
        lastUpdated: new Date().getTime(),
      };

    case FINANCIAL_ACTIONS.DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter(tx => tx.id !== action.payload),
        lastUpdated: new Date().getTime(),
      };

    case FINANCIAL_ACTIONS.SET_BALANCE:
      return {
        ...state,
        balance: { ...state.balance, ...action.payload },
      };

    case FINANCIAL_ACTIONS.SET_OBJECTIVES:
      return {
        ...state,
        objectives: action.payload,
      };

    case FINANCIAL_ACTIONS.ADD_OBJECTIVE:
      return {
        ...state,
        objectives: [action.payload, ...state.objectives],
      };

    case FINANCIAL_ACTIONS.UPDATE_OBJECTIVE:
      return {
        ...state,
        objectives: state.objectives.map(obj =>
          obj.id === action.payload.id ? action.payload : obj
        ),
      };

    case FINANCIAL_ACTIONS.DELETE_OBJECTIVE:
      return {
        ...state,
        objectives: state.objectives.filter(obj => obj.id !== action.payload),
      };

    case FINANCIAL_ACTIONS.SET_ANALYTICS:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          ...action.payload,
        },
      };

    case FINANCIAL_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        refreshing: false,
      };

    case FINANCIAL_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case FINANCIAL_ACTIONS.RESET_DATA:
      return initialState;

    // ✅ NOVOS CASES
    case FINANCIAL_ACTIONS.SET_DAILY_VALUES:
      return {
        ...state,
        dailyGains: action.payload.gains,
        dailyLosses: action.payload.losses,
      };

    case FINANCIAL_ACTIONS.RESET_DAILY_VALUES:
      return {
        ...state,
        dailyGains: 0,
        dailyLosses: 0,
      };

    case FINANCIAL_ACTIONS.SET_LAST_RESET_DATE:
      return {
        ...state,
        lastResetDate: action.payload,
      };

    default:
      return state;
  }
};

// Cache keys
const CACHE_KEYS = {
  TRANSACTIONS: 'cached_transactions',
  BALANCE: 'cached_balance',
  OBJECTIVES: 'cached_objectives',
  LAST_SYNC: 'last_sync_time',
  // ✅ NOVOS
  DAILY_GAINS: 'daily_gains',
  DAILY_LOSSES: 'daily_losses',
  LAST_RESET_DATE: 'last_reset_date',
};

// Função auxiliar para normalizar transações
const normalizeTransaction = (transaction) => {
  const amount = parseFloat(transaction.amount) || 0;
  
  return {
    ...transaction,
    amount: Math.abs(amount),
    type: ['deposit', 'withdraw', 'gains', 'losses'].includes(transaction.type) 
      ? transaction.type 
      : (amount >= 0 ? 'deposit' : 'withdraw')
  };
};

export const FinancialProvider = ({ children }) => {
  const [state, dispatch] = useReducer(financialReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // ✅ NOVA FUNÇÃO: Verificar se é um novo dia
  const isNewDay = useCallback(() => {
    if (!state.lastResetDate) return true;
    
    const today = new Date();
    const lastReset = new Date(state.lastResetDate);
    
    return (
      today.getDate() !== lastReset.getDate() ||
      today.getMonth() !== lastReset.getMonth() ||
      today.getFullYear() !== lastReset.getFullYear()
    );
  }, [state.lastResetDate]);

  // ✅ NOVA FUNÇÃO: Salvar histórico diário (opcional)
  const saveDailyHistory = useCallback(async (userId, data) => {
    try {
      const historyKey = `dailyHistory_${userId}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      history.push({
        date: data.date,
        gains: data.gains,
        losses: data.losses,
        timestamp: new Date().toISOString()
      });
      
      // Manter apenas últimos 90 dias
      const last90Days = history.slice(-90);
      localStorage.setItem(historyKey, JSON.stringify(last90Days));
      
      console.log('📊 Histórico diário salvo:', data);
    } catch (error) {
      console.error('Erro ao salvar histórico diário:', error);
    }
  }, []);

  // ✅ NOVA FUNÇÃO: Resetar valores diários
  const resetDailyValues = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString();
      
      // Salvar histórico do dia anterior
      if (state.lastResetDate) {
        await saveDailyHistory(user.id, {
          date: state.lastResetDate,
          gains: state.dailyGains,
          losses: state.dailyLosses
        });
      }

      // Resetar valores no estado
      dispatch({
        type: FINANCIAL_ACTIONS.RESET_DAILY_VALUES
      });

      dispatch({
        type: FINANCIAL_ACTIONS.SET_LAST_RESET_DATE,
        payload: today
      });

      // Salvar no localStorage
      localStorage.setItem(`${CACHE_KEYS.LAST_RESET_DATE}_${user.id}`, today);
      localStorage.setItem(`${CACHE_KEYS.DAILY_GAINS}_${user.id}`, '0');
      localStorage.setItem(`${CACHE_KEYS.DAILY_LOSSES}_${user.id}`, '0');

      console.log('✅ Valores diários resetados:', { date: today });
    } catch (error) {
      console.error('Erro ao resetar valores diários:', error);
    }
  }, [user, state.dailyGains, state.dailyLosses, state.lastResetDate, saveDailyHistory]);

  // ✅ NOVA FUNÇÃO: Calcular totais diários das transações
  const calculateDailyTotals = useCallback((transactionsList) => {
    if (!user?.id) return { gains: 0, losses: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dayGains = 0;
    let dayLosses = 0;

    transactionsList.forEach(transaction => {
      const transactionDate = new Date(transaction.created_at || transaction.date);
      transactionDate.setHours(0, 0, 0, 0);

      // Apenas transações de hoje
      if (transactionDate.getTime() === today.getTime()) {
        const amount = parseFloat(transaction.amount) || 0;
        
        if (transaction.type === 'gains') {
          dayGains += amount;
        } else if (transaction.type === 'losses') {
          dayLosses += amount;
        }
      }
    });

    return { gains: dayGains, losses: dayLosses };
  }, [user]);

  // ✅ EFEITO: Carregar valores diários do localStorage e verificar reset
  useEffect(() => {
    if (!user?.id) return;

    // Carregar valores salvos
    const savedLastReset = localStorage.getItem(`${CACHE_KEYS.LAST_RESET_DATE}_${user.id}`);
    const savedDailyGains = parseFloat(localStorage.getItem(`${CACHE_KEYS.DAILY_GAINS}_${user.id}`) || '0');
    const savedDailyLosses = parseFloat(localStorage.getItem(`${CACHE_KEYS.DAILY_LOSSES}_${user.id}`) || '0');

    if (savedLastReset) {
      dispatch({
        type: FINANCIAL_ACTIONS.SET_LAST_RESET_DATE,
        payload: savedLastReset
      });

      dispatch({
        type: FINANCIAL_ACTIONS.SET_DAILY_VALUES,
        payload: { gains: savedDailyGains, losses: savedDailyLosses }
      });
    }

    // Verificar se precisa resetar
    if (isNewDay()) {
      resetDailyValues();
    }

    // Configurar verificação periódica (a cada 1 minuto)
    const checkInterval = setInterval(() => {
      if (isNewDay()) {
        resetDailyValues();
      }
    }, 60000);

    return () => clearInterval(checkInterval);
  }, [user, isNewDay, resetDailyValues]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadInitialData();
    } else {
      dispatch({ type: FINANCIAL_ACTIONS.RESET_DATA });
      clearCache();
    }
  }, [isAuthenticated, user]);

  const loadFromCache = () => {
    try {
      const cachedTransactions = localStorage.getItem(CACHE_KEYS.TRANSACTIONS);
      const cachedBalance = localStorage.getItem(CACHE_KEYS.BALANCE);
      const cachedObjectives = localStorage.getItem(CACHE_KEYS.OBJECTIVES);

      if (cachedTransactions) {
        const transactions = JSON.parse(cachedTransactions).map(normalizeTransaction);
        dispatch({
          type: FINANCIAL_ACTIONS.SET_TRANSACTIONS,
          payload: transactions,
        });
      }

      if (cachedBalance) {
        dispatch({
          type: FINANCIAL_ACTIONS.SET_BALANCE,
          payload: parseFloat(cachedBalance),
        });
      }

      if (cachedObjectives) {
        dispatch({
          type: FINANCIAL_ACTIONS.SET_OBJECTIVES,
          payload: JSON.parse(cachedObjectives),
        });
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
  };

  const saveToCache = (key, data) => {
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const clearCache = () => {
    try {
      Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const loadInitialData = async () => {
    dispatch({ type: FINANCIAL_ACTIONS.SET_LOADING, payload: true });
    
    try {
      loadFromCache();
      await refreshData();
    } catch (error) {
      console.error('Error loading initial data:', error);
      dispatch({
        type: FINANCIAL_ACTIONS.SET_ERROR,
        payload: 'Failed to load financial data',
      });
    } finally {
      dispatch({ type: FINANCIAL_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const refreshData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      dispatch({ type: FINANCIAL_ACTIONS.SET_REFRESHING, payload: true });
    }

    try {
      const [transactionsResponse, balanceResponse, objectivesResponse] = await Promise.all([
        apiService.getTransactions(),
        apiService.getBalance(),
        apiService.getObjectives(),
      ]);

      if (transactionsResponse.success) {
        const normalizedTransactions = transactionsResponse.data.map(normalizeTransaction);
        dispatch({
          type: FINANCIAL_ACTIONS.SET_TRANSACTIONS,
          payload: normalizedTransactions,
        });
        saveToCache(CACHE_KEYS.TRANSACTIONS, normalizedTransactions);

        // ✅ NOVO: Calcular e atualizar valores diários
        const dailyTotals = calculateDailyTotals(normalizedTransactions);
        dispatch({
          type: FINANCIAL_ACTIONS.SET_DAILY_VALUES,
          payload: dailyTotals
        });

        // Salvar valores diários no localStorage
        if (user?.id) {
          localStorage.setItem(`${CACHE_KEYS.DAILY_GAINS}_${user.id}`, dailyTotals.gains.toString());
          localStorage.setItem(`${CACHE_KEYS.DAILY_LOSSES}_${user.id}`, dailyTotals.losses.toString());
        }
      }

      if (balanceResponse.success) {
        const currentBalance = parseFloat(balanceResponse.balance);
        const initialBalanceValue = parseFloat(balanceResponse.initial_bank);

        dispatch({
          type: FINANCIAL_ACTIONS.SET_BALANCE,
          payload: {
            current: currentBalance,
            initial: initialBalanceValue,
          },
        });

        saveToCache(CACHE_KEYS.BALANCE, currentBalance.toString());
      }

      if (objectivesResponse.success) {
        dispatch({
          type: FINANCIAL_ACTIONS.SET_OBJECTIVES,
          payload: objectivesResponse.data,
        });
        saveToCache(CACHE_KEYS.OBJECTIVES, objectivesResponse.data);
      }

      localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().getTime().toString());
      dispatch({ type: FINANCIAL_ACTIONS.CLEAR_ERROR });
    } catch (error) {
      console.error('Error refreshing data:', error);
      dispatch({
        type: FINANCIAL_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to refresh data',
      });
    } finally {
      if (showRefreshing) {
        dispatch({ type: FINANCIAL_ACTIONS.SET_REFRESHING, payload: false });
      }
    }
  }, [calculateDailyTotals, user]);

  const getBankResetStatus = useCallback(async () => {
    try {
      const response = await apiService.getBankResetStatus();
      if (response.success) {
        return response;
      }
      return null;
    } catch (error) {
      console.error('Error getting bank reset status:', error);
      return null;
    }
  }, []);

  const forceResetBank = useCallback(async () => {
    try {
      const response = await apiService.forceResetBank();
      if (response.success) {
        await refreshData();
        return { success: true, resetInfo: response.reset_info };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Error forcing bank reset:', error);
      return { success: false, error: error.message };
    }
  }, [refreshData]);

  // ✅ NOVA FUNÇÃO: Reset manual dos valores diários
  const manualResetDaily = useCallback(async () => {
    await resetDailyValues();
    await refreshData();
  }, [resetDailyValues, refreshData]);

  const addTransaction = async (transactionData) => {
    try {
      const currentState = state;
      const normalizedData = normalizeTransaction(transactionData);
      const response = await apiService.createTransaction(normalizedData);
      
      if (response.success) {
        const normalizedTransaction = normalizeTransaction(response.data);
        
        dispatch({
          type: FINANCIAL_ACTIONS.ADD_TRANSACTION,
          payload: normalizedTransaction,
        });
        
        let newBalance;
        const transactionAmount = parseFloat(normalizedTransaction.amount);

        if (normalizedTransaction.type === 'deposit' || normalizedTransaction.type === 'gains') {
          newBalance = currentState.balance + transactionAmount;
        } else if (normalizedTransaction.type === 'withdraw' || normalizedTransaction.type === 'losses') {
          newBalance = currentState.balance - transactionAmount;
        } else {
          newBalance = currentState.balance;
        }

        dispatch({
          type: FINANCIAL_ACTIONS.SET_BALANCE,
          payload: newBalance,
        });
        
        const updatedTransactions = [normalizedTransaction, ...currentState.transactions];
        saveToCache(CACHE_KEYS.TRANSACTIONS, updatedTransactions);
        saveToCache(CACHE_KEYS.BALANCE, newBalance.toString());

        // ✅ NOVO: Atualizar valores diários após adicionar transação
        await refreshData();
        
        return { success: true, data: normalizedTransaction };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error: error.message };
    }
  };

  const updateTransaction = async (transactionId, updateData) => {
    try {
      const normalizedData = normalizeTransaction(updateData);
      const response = await apiService.updateTransaction(transactionId, normalizedData);
      
      if (response.success) {
        const normalizedTransaction = normalizeTransaction(response.data);
        
        dispatch({
          type: FINANCIAL_ACTIONS.UPDATE_TRANSACTION,
          payload: normalizedTransaction,
        });

        await refreshData();
        
        return { success: true, data: normalizedTransaction };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteTransaction = async (transactionId) => {
    try {
      const response = await apiService.deleteTransaction(transactionId);
      
      if (response.success) {
        dispatch({
          type: FINANCIAL_ACTIONS.DELETE_TRANSACTION,
          payload: transactionId,
        });
        
        await refreshData();
        
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, error: error.message };
    }
  };

  const addObjective = async (objectiveData) => {
    try {
      const response = await apiService.createObjective(objectiveData);
      
      if (response.success) {
        dispatch({
          type: FINANCIAL_ACTIONS.ADD_OBJECTIVE,
          payload: response.data,
        });
        
        const updatedObjectives = [response.data, ...state.objectives];
        saveToCache(CACHE_KEYS.OBJECTIVES, updatedObjectives);
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error adding objective:', error);
      return { success: false, error: error.message };
    }
  };

  const updateObjective = async (objectiveId, updateData) => {
    try {
      const response = await apiService.updateObjective(objectiveId, updateData);
      
      if (response.success) {
        dispatch({
          type: FINANCIAL_ACTIONS.UPDATE_OBJECTIVE,
          payload: response.data,
        });
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error updating objective:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteObjective = async (objectiveId) => {
    try {
      const response = await apiService.deleteObjective(objectiveId);
      
      if (response.success) {
        dispatch({
          type: FINANCIAL_ACTIONS.DELETE_OBJECTIVE,
          payload: objectiveId,
        });
        
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
      return { success: false, error: error.message };
    }
  };

  const loadAnalytics = async () => {
    try {
      const [overviewResponse, monthlyResponse, performanceResponse, riskResponse] = await Promise.all([
        apiService.getAnalyticsOverview(),
        apiService.getMonthlyAnalytics(),
        apiService.getPerformanceStats(),
        apiService.getRiskAnalysis(),
      ]);

      const analyticsData = {};
      
      if (overviewResponse.success) {
        analyticsData.overview = overviewResponse.data;
      }
      if (monthlyResponse.success) {
        analyticsData.monthly = monthlyResponse.data;
      }
      if (performanceResponse.success) {
        analyticsData.performance = performanceResponse.data;
      }
      if (riskResponse.success) {
        analyticsData.riskAnalysis = riskResponse.data;
      }

      dispatch({
        type: FINANCIAL_ACTIONS.SET_ANALYTICS,
        payload: analyticsData,
      });
      
      return { success: true, data: analyticsData };
    } catch (error) {
      console.error('Error loading analytics:', error);
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    dispatch({ type: FINANCIAL_ACTIONS.CLEAR_ERROR });
  };

  const getRealProfit = useCallback(() => {
    try {
      const totalGains = state.transactions
        .filter(tx => tx.type === 'gains' && tx.amount && !isNaN(parseFloat(tx.amount)))
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      const totalLosses = state.transactions
        .filter(tx => tx.type === 'losses' && tx.amount && !isNaN(parseFloat(tx.amount)))
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      const profit = totalGains - totalLosses;
      return isNaN(profit) ? 0 : profit;
    } catch (error) {
      console.error('Error calculating real profit:', error);
      return 0;
    }
  }, [state.transactions]);

  const getOperationalBalance = useCallback(() => {
    try {
      const totalDeposits = state.transactions
        .filter(tx => tx.type === 'deposit' && tx.amount && !isNaN(parseFloat(tx.amount)))
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      const totalWithdraws = state.transactions
        .filter(tx => tx.type === 'withdraw' && tx.amount && !isNaN(parseFloat(tx.amount)))
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      const realProfit = getRealProfit();
      
      const operationalBalance = totalDeposits - totalWithdraws + realProfit;
      return isNaN(operationalBalance) ? 0 : operationalBalance;
    } catch (error) {
      console.error('Error calculating operational balance:', error);
      return 0;
    }
  }, [state.transactions, getRealProfit]);

  const totalDeposits = (() => {
    try {
      return state.transactions
        .filter(tx => tx.type === 'deposit' && tx.amount && !isNaN(parseFloat(tx.amount)))
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    } catch (error) {
      console.error('Error calculating total deposits:', error);
      return 0;
    }
  })();

  const totalWithdraws = (() => {
    try {
      return state.transactions
        .filter(tx => tx.type === 'withdraw' && tx.amount && !isNaN(parseFloat(tx.amount)))
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    } catch (error) {
      console.error('Error calculating total withdraws:', error);
      return 0;
    }
  })();

  const totalGains = (() => {
    try {
      return state.transactions
        .filter(tx => tx.type === 'gains' && tx.amount && !isNaN(parseFloat(tx.amount)))
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    } catch (error) {
      console.error('Error calculating total gains:', error);
      return 0;
    }
  })();

  const totalLosses = (() => {
    try {
      return state.transactions
        .filter(tx => tx.type === 'losses' && tx.amount && !isNaN(parseFloat(tx.amount)))
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    } catch (error) {
      console.error('Error calculating total losses:', error);
      return 0;
    }
  })();

  const initialBankBalance = (() => {
    try {
      const initialTransactions = state.transactions.filter(tx => tx.is_initial_bank === true);
      
      if (initialTransactions.length === 0) return 0;

      const total = initialTransactions.reduce((sum, tx) => {
        const amount = tx.amount && !isNaN(parseFloat(tx.amount)) ? parseFloat(tx.amount) : 0;
        
        if (tx.type === 'deposit') {
          return sum + amount;
        } else if (tx.type === 'withdraw') {
          return sum - amount;
        }
        return sum;
      }, 0);
      
      return Math.max(0, total);
    } catch (error) {
      console.error('Error getting initial bank balance:', error);
      return 0;
    }
  })();

  const getEffectiveInitialBalance = () => {
    return state.balance.initial || 0;
  };

  const getOperationalProfit = () => {
    try {
      const effectiveInitial = getEffectiveInitialBalance();
      const profit = state.balance.current - effectiveInitial;
      return isNaN(profit) ? 0 : profit;
    } catch (error) {
      console.error('Error calculating operational profit:', error);
      return 0;
    }
  };

  const getUniqueCategories = () => {
    const categories = state.transactions
      .map(tx => tx.category)
      .filter(Boolean);
    return [...new Set(categories)];
  };

  const getMonthlyData = () => {
    const monthlyData = {};
    
    state.transactions.forEach(tx => {
      try {
        const date = new Date(tx.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            deposits: 0,
            withdraws: 0,
            gains: 0,
            losses: 0,
            balance: 0,
          };
        }
        
        const amount = tx.amount && !isNaN(parseFloat(tx.amount)) ? parseFloat(tx.amount) : 0;
        
        if (tx.type === 'deposit') monthlyData[monthKey].deposits += amount;
        else if (tx.type === 'withdraw') monthlyData[monthKey].withdraws += amount;
        else if (tx.type === 'gains') monthlyData[monthKey].gains += amount;
        else if (tx.type === 'losses') monthlyData[monthKey].losses += amount;
        
        monthlyData[monthKey].balance = monthlyData[monthKey].deposits - monthlyData[monthKey].withdraws + monthlyData[monthKey].gains - monthlyData[monthKey].losses;
      } catch (error) {
        console.error('Error processing transaction for monthly data:', error);
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const getCategoryData = () => {
    const categoryData = {};
    
    state.transactions
      .filter(tx => tx.type === 'withdraw' || tx.type === 'losses')
      .forEach(tx => {
        try {
          const category = tx.category || 'Outros';
          const amount = tx.amount && !isNaN(parseFloat(tx.amount)) ? parseFloat(tx.amount) : 0;
          
          if (!categoryData[category]) {
            categoryData[category] = { category, amount: 0, count: 0 };
          }
          categoryData[category].amount += amount;
          categoryData[category].count += 1;
        } catch (error) {
          console.error('Error processing transaction for category data:', error);
        }
      });
    
    return Object.values(categoryData).sort((a, b) => b.amount - a.amount);
  };

  const value = {
    // State
    transactions: state.transactions,
    balance: state.balance.current,
    initialBankBalance: state.balance.initial,
    objectives: state.objectives,
    analytics: state.analytics,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // ✅ NOVOS: Valores diários
    dailyGains: state.dailyGains,
    dailyLosses: state.dailyLosses,
    lastResetDate: state.lastResetDate,
    
    // Resets
    getBankResetStatus,
    forceResetBank,
    manualResetDaily, // ✅ NOVO
    
    // Computed values
    totalDeposits,
    totalWithdraws,
    totalGains,
    totalLosses,
    initialBankBalance,
    getRealProfit,
    getOperationalBalance,
    
    // Actions
    refreshData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addObjective,
    updateObjective,
    deleteObjective,
    loadAnalytics,
    clearError,
    
    // Helper functions
    getEffectiveInitialBalance,
    getOperationalProfit,
    getUniqueCategories,
    getMonthlyData,
    getCategoryData,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

export default FinancialContext;