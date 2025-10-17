// Enhanced api.js ported for React-Vite with unified transaction system support
import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return 'https://gerenciamento.sortehub.online';
  } else {
    return 'https://gerenciamento.sortehub.online';
  }
};
const STATIC_BASE_URL = 'https://gerenciamento.sortehub.online';
const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transaction types constants for validation
const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  GAINS: 'gains',
  LOSSES: 'losses'
};

const VALID_TRANSACTION_TYPES = Object.values(TRANSACTION_TYPES);

const tokenManager = {
  getToken() {
    try {
      return localStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  setToken(token) {
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  clearToken() {
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('Request Data:', config.data);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.config.url} - ${response.status}`);
    }
    return response.data || response;
  },
  async (error) => {
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.data || error.message);
    }

    if (error.response?.status === 401) {
      tokenManager.clearToken();
    }

    const message = error.response?.data?.error || 
                   error.response?.data?.message || 
                   error.message || 
                   'Network error';
    
    return Promise.reject(new Error(message));
  }
);

// Updated API service with is_initial_bank support
const apiService = {
  // Constants for transaction types
  TRANSACTION_TYPES,

  // Token management
  setAuthToken: tokenManager.setToken,
  getAuthToken: tokenManager.getToken,
  clearAuthToken: tokenManager.clearToken,

  // Auth endpoints
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.success && response.token) {
        tokenManager.setToken(response.token);
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // REGISTRO ATUALIZADO COM VALIDAÇÃO DE BANCA INICIAL
  async register({name, email, password, initialBank, riskValue}) {
    try {
      if (!name || !email || !password) {
        return { success: false, error: 'Nome, email e senha são obrigatórios' };
      }

      if (!initialBank || initialBank <= 0) {
        return { success: false, error: 'Banca inicial é obrigatória e deve ser maior que zero' };
      }

      const bankAmount = typeof initialBank === 'string' ? parseFloat(initialBank.replace(',', '.')) : initialBank;
      
      if (isNaN(bankAmount) || bankAmount <= 0) {
        return { success: false, error: 'Valor da banca inicial inválido' };
      }

      const response = await api.post('/auth/register', { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password,
        initialBank: bankAmount,
        riskValue: riskValue 
      });

      if (response.success && response.token) {
        tokenManager.setToken(response.token);
      }

      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Logout API call failed, but clearing local token');
    } finally {
      tokenManager.clearToken();
    }
  },
  async resetPassword(email) {
    try {
      // Confirme se '/auth/reset-password' é o endpoint correto da sua API
      const response = await api.post('/auth/reset-password', { email });
      return response; // O interceptor já trata 'response.data'
    } catch (error) {
      // O interceptor já transforma o erro, mas para manter
      // a consistência com login/register, retornamos um objeto de erro
      return { success: false, error: error.message };
    }
  },
  // User profile management
  async getUserProfile() {
    try {
      const response = await api.get('/user/profile');
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async updateUserProfile(profileData) {
    try {
      const config = profileData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};

      const response = await api.put('/user/profile', profileData, config);
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await api.put('/user/change-password', passwordData);
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Dashboard
  async getDashboardOverview() {
    try {
      return await api.get('/dashboard/overview');
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Betting Profile endpoints
  getBettingProfile: () => api.get('/betting-profiles'),
  createBettingProfile: (data) => api.post('/betting-profiles', data),
  updateBettingProfile: (profileId, data) => api.put(`/betting-profiles/${profileId}`, data),

  // Balance and transactions
  getBalance: () => api.get('/balance'),
  getTransactions: (params = {}) => api.get('/transactions', { params }),
  
  // NOVA FUNÇÃO: Obter transações de banca inicial específicas
  async getInitialBankTransactions() {
    try {
      return await api.get('/transactions', { 
        params: { is_initial_bank: true } 
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // NOVA FUNÇÃO: Obter saldo da banca inicial
  async getInitialBankBalance() {
    try {
      const response = await api.get('/balance/initial-bank');
      return response;
    } catch (error) {
      // Se o endpoint não existir, calculamos localmente
      const transactionsResponse = await this.getInitialBankTransactions();
      if (transactionsResponse.success) {
        const initialBankBalance = this.calculateInitialBankBalance(transactionsResponse.data);
        return { 
          success: true, 
          balance: initialBankBalance,
          transactions: transactionsResponse.data 
        };
      }
      return { success: false, error: error.message };
    }
  },

  // FUNÇÃO AUXILIAR: Calcular banca inicial localmente
  calculateInitialBankBalance(transactions) {
    if (!transactions || transactions.length === 0) return 0;

    const total = transactions.reduce((sum, transaction) => {
      const amount = transaction.amount && !isNaN(parseFloat(transaction.amount)) 
        ? parseFloat(transaction.amount) 
        : 0;
      
      if (transaction.type === TRANSACTION_TYPES.DEPOSIT) {
        return sum + amount;
      } else if (transaction.type === TRANSACTION_TYPES.WITHDRAW) {
        return sum - amount;
      }
      return sum;
    }, 0);
    
    return Math.max(0, total);
  },

  // TRANSAÇÃO COMPLETAMENTE ATUALIZADA PARA O SISTEMA UNIFICADO COM is_initial_bank
  async createTransaction(data) {
    try {
      if (!data.type || !VALID_TRANSACTION_TYPES.includes(data.type)) {
        return { success: false, error: `Tipo de transação inválido. Tipos válidos: ${VALID_TRANSACTION_TYPES.join(', ')}` };
      }
      if (!data.amount || data.amount <= 0) {
        return { success: false, error: 'Valor deve ser maior que zero' };
      }
      if (!data.date) {
        return { success: false, error: 'Data é obrigatória' };
      }
      
      const transactionData = {
        type: data.type,
        amount: data.amount,
        date: data.date,
        description: data.description || this.getDefaultDescription(data.type),
        category: data.category || this.getDefaultCategory(data.type),
        is_initial_bank: data.is_initial_bank || false // ← COLUNA ATUALIZADA
      };

      return await api.post('/transactions', transactionData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Helper para obter descrição padrão baseada no tipo
  getDefaultDescription(type) {
    switch (type) {
      case TRANSACTION_TYPES.DEPOSIT: return 'Depósito na banca';
      case TRANSACTION_TYPES.WITHDRAW: return 'Saque da banca';
      case TRANSACTION_TYPES.GAINS: return 'Ganhos em operações';
      case TRANSACTION_TYPES.LOSSES: return 'Perdas em operações';
      default: return 'Transação';
    }
  },

  // Helper para obter categoria padrão baseada no tipo
  getDefaultCategory(type) {
    switch (type) {
      case TRANSACTION_TYPES.DEPOSIT: return 'Depósito';
      case TRANSACTION_TYPES.WITHDRAW: return 'Saque';
      case TRANSACTION_TYPES.GAINS: return 'Ganhos';
      case TRANSACTION_TYPES.LOSSES: return 'Perdas';
      default: return 'Geral';
    }
  },

  // Validação específica para cada tipo de transação
  validateTransaction(data) {
    if (!data.type || !VALID_TRANSACTION_TYPES.includes(data.type)) {
      return { isValid: false, error: 'Tipo de transação é obrigatório e deve ser válido' };
    }
    if (!data.amount || data.amount <= 0) {
      return { isValid: false, error: 'Valor deve ser maior que zero' };
    }
    if (!data.date) {
      return { isValid: false, error: 'Data é obrigatória' };
    }

    // Validação específica para transações de banca inicial
    if (data.is_initial_bank && data.type === TRANSACTION_TYPES.DEPOSIT && data.amount < 1) {
      return { isValid: false, error: 'Banca inicial deve ser de pelo menos R$ 1,00' };
    }

    return { isValid: true };
  },

  // Métodos para análise de transações
  async getTransactionStats(period = 'monthly') {
    try {
      return await api.get('/transactions/stats', { params: { period } });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getProfitAnalysis(startDate, endDate) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      return await api.get('/transactions/profit-analysis', { params });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Métodos para transações por tipo
  async getTransactionsByType(type, params = {}) {
    try {
      if (!VALID_TRANSACTION_TYPES.includes(type)) {
        return { success: false, error: 'Tipo de transação inválido' };
      }
      return await api.get('/transactions', { params: { ...params, type } });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Métodos específicos por tipo de transação
  getDeposits: (params) => apiService.getTransactionsByType(TRANSACTION_TYPES.DEPOSIT, params),
  getWithdrawals: (params) => apiService.getTransactionsByType(TRANSACTION_TYPES.WITHDRAW, params),
  getGains: (params) => apiService.getTransactionsByType(TRANSACTION_TYPES.GAINS, params),
  getLosses: (params) => apiService.getTransactionsByType(TRANSACTION_TYPES.LOSSES, params),

  updateTransaction: (transactionId, data) => api.put(`/transactions/${transactionId}`, data),
  deleteTransaction: (transactionId) => api.delete(`/transactions/${transactionId}`),
  
  // Objectives
  getObjectives: () => api.get('/objectives'),
  createObjective: (data) => api.post('/objectives', data),
  updateObjective: (objectiveId, data) => api.put(`/objectives/${objectiveId}`, data),
  deleteObjective: (objectiveId) => api.delete(`/objectives/${objectiveId}`),

  // Analytics aprimorado
  getAnalyticsOverview: () => api.get('/analytics/overview'),
  getMonthlyAnalytics: (months = 6) => api.get('/analytics/monthly', { params: { months } }),
  getPerformanceStats: (period = 'monthly') => api.get('/stats/performance', { params: { period } }),
  getRiskAnalysis: () => api.get('/stats/risk-analysis'),
  
  getOperationalPerformance: (params = {}) => api.get('/analytics/operational-performance', { params }),
  getCashFlowAnalysis: (params = {}) => api.get('/analytics/cash-flow', { params }),

  // Categories & Game Types
  getCategories: () => api.get('/categories'),
  getGameTypes: () => api.get('/game-types'),
  
  // ========================================
  // ✅ NOVAS FUNÇÕES DE RESET AUTOMÁTICO
  // ========================================
  
  /**
   * Busca o status do próximo reset de banca (30 dias)
   * @returns {Promise<Object>} Status do reset com dias restantes
   */
  async getBankResetStatus() {
    try {
      const response = await api.get('/user/bank-reset-status');
      return response;
    } catch (error) {
      console.error('Error getting bank reset status:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar status de reset'
      };
    }
  },

  /**
   * Força um reset manual da banca (transforma saldo atual em nova banca inicial)
   * @returns {Promise<Object>} Informações do reset realizado
   */
  async forceResetBank() {
    try {
      const response = await api.post('/user/force-bank-reset');
      return response;
    } catch (error) {
      console.error('Error forcing bank reset:', error);
      return {
        success: false,
        error: error.message || 'Erro ao forçar reset de banca'
      };
    }
  },

  /**
   * Verifica se há reset pendente (para uso interno)
   * @returns {Promise<boolean>} True se há reset pendente
   */
  async hasResetPending() {
    try {
      const status = await this.getBankResetStatus();
      return status.success && status.reset_due === true;
    } catch (error) {
      console.error('Error checking reset pending:', error);
      return false;
    }
  },

  // ========================================
  // FIM DAS FUNÇÕES DE RESET
  // ========================================
  
  // Health check
  healthCheck: () => api.get('/health'),

  async testConnection() {
    try {
      const response = await api.get('/health', { timeout: 5000 });
      
      if (response && response.status === 'ok') {
        console.log('API Connection successful:', response);
        return { success: true, data: response };
      } else {
        console.error('API Connection failed: Invalid response', response);
        return { success: false, error: 'Resposta inválida da API' };
      }
    } catch (error) {
      console.error('API Connection failed:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  // Utility methods
  validateInitialBank(amount) {
    const minAmount = 1.00;
    const maxAmount = 1000000.00;
    
    if (!amount || amount <= 0) {
      return { isValid: false, error: 'Banca inicial deve ser maior que zero' };
    }

    const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
    
    if (isNaN(numericAmount)) {
      return { isValid: false, error: 'Valor inválido' };
    }
    if (numericAmount < minAmount) {
      return { isValid: false, error: `Banca inicial deve ser de pelo menos R$ ${minAmount.toFixed(2)}` };
    }
    if (numericAmount > maxAmount) {
      return { isValid: false, error: `Banca inicial não pode exceder R$ ${maxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` };
    }

    return { isValid: true, amount: numericAmount };
  },

  formatCurrency(amount) {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
    if (isNaN(numericAmount)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericAmount);
  },

  parseCurrencyInput(input) {
    if (!input) return 0;
    const cleaned = input.toString().replace(/[^\d.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
  },

  isOperationalTransaction: (type) => type === TRANSACTION_TYPES.GAINS || type === TRANSACTION_TYPES.LOSSES,
  isCashFlowTransaction: (type) => type === TRANSACTION_TYPES.DEPOSIT || type === TRANSACTION_TYPES.WITHDRAW,

  calculateRealProfit(transactions) {
    const gains = transactions
      .filter(tx => tx.type === TRANSACTION_TYPES.GAINS)
      .reduce((acc, tx) => acc + tx.amount, 0);
    const losses = transactions
      .filter(tx => tx.type === TRANSACTION_TYPES.LOSSES)
      .reduce((acc, tx) => acc + tx.amount, 0);
    return gains - losses;
  },

  calculatePerformanceMetrics(transactions) {
    const gains = transactions.filter(tx => tx.type === TRANSACTION_TYPES.GAINS);
    const losses = transactions.filter(tx => tx.type === TRANSACTION_TYPES.LOSSES);
    
    const totalGains = gains.reduce((acc, tx) => acc + tx.amount, 0);
    const totalLosses = losses.reduce((acc, tx) => acc + tx.amount, 0);
    const totalTrades = gains.length + losses.length;
    const winningTrades = gains.length;
    
    return {
      totalGains,
      totalLosses,
      realProfit: totalGains - totalLosses,
      totalTrades,
      winningTrades,
      losingTrades: losses.length,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      avgGain: gains.length > 0 ? totalGains / gains.length : 0,
      avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      profitFactor: totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? Infinity : 0
    };
  }
};

export default apiService;