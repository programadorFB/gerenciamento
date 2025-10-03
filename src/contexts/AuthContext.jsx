import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api'; // Certifique-se que o caminho para seu api.js está correto

const AuthContext = createContext(null);

// Constantes para as ações do Reducer
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE_START: 'UPDATE_PROFILE_START',
  UPDATE_PROFILE_SUCCESS: 'UPDATE_PROFILE_SUCCESS',
  UPDATE_PROFILE_FAILURE: 'UPDATE_PROFILE_FAILURE',
  RESTORE_SESSION: 'RESTORE_SESSION',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Estado inicial do contexto
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true, // Começa como true para verificar a sessão
  error: null,
};

// Reducer para gerenciar as mudanças de estado
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.UPDATE_PROFILE_START:
      return { ...state, isLoading: true, error: null };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.UPDATE_PROFILE_FAILURE:
      return { ...state, isLoading: false, isInitializing: false, error: action.payload };

    case AUTH_ACTIONS.UPDATE_PROFILE_SUCCESS:
      return { ...state, user: action.payload.user, isLoading: false, error: null };

    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState, isInitializing: false };

    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isInitializing: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

// Chaves para o localStorage
const STORAGE_KEYS = {
  TOKEN: 'userToken',
  USER: 'userData',
};

// Componente Provedor
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Ao iniciar a aplicação, tenta restaurar a sessão
    initializeAuth();
  }, []);

  // --- Funções de Armazenamento (convertidas para localStorage) ---

  const saveToStorage = (token, user) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  const clearStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Erro ao limpar o localStorage:', error);
    }
  };

  const initializeAuth = async () => {
    try {
      // localStorage é síncrono, não precisa de 'await'
      const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (savedToken && savedUser) {
        const userData = JSON.parse(savedUser);
        apiService.setAuthToken(savedToken);
        
        // Simplesmente restaura a sessão com os dados locais
        // A validação com o servidor pode ser feita em outro momento, se necessário
        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          payload: { user: userData, token: savedToken },
        });
        return;
      }
      // Se não houver dados, simplesmente desloga
      clearStorage();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      clearStorage();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // --- Funções de Ação ---

  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const response = await apiService.login(email, password);
      if (response.success) {
        const { token, user } = response;
        apiService.setAuthToken(token);
        saveToStorage(token, user); // Síncrono
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { token, user } });
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: response.error || 'Login falhou' });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro de rede';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };
  
  // --- FUNÇÃO REGISTER ATUALIZADA ---
  // Agora aceita um único objeto com todos os dados do usuário
  const register = async (userData) => { // <-- MUDANÇA AQUI
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    try {
      // Passa o objeto userData diretamente para o serviço da API
      const response = await apiService.register(userData); // <-- MUDANÇA AQUI
      if (response.success) {
        const { token, user } = response;
        apiService.setAuthToken(token);
        saveToStorage(token, user); // Síncrono
        dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: { token, user } });
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: response.error || 'Cadastro falhou' });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro de rede';
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (profileData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE_START });
    try {
      const response = await apiService.updateUserProfile(profileData);
      if (response.success) {
        const updatedUser = { ...state.user, ...response.data };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE_SUCCESS, payload: { user: updatedUser } });
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE_FAILURE, payload: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE_FAILURE, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      if (state.token) {
        // Se você tiver uma rota de 'logout' no backend, chame-a aqui
        // await apiService.logout(); 
      }
    } finally {
      apiService.clearAuthToken();
      clearStorage(); // Síncrono
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };
  
  // Valor que será provido para os componentes filhos
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};