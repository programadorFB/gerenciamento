import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// --- Contexts and Hooks ---
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { SideMenuProvider } from './contexts/SideMenuContext.jsx';
import { FinancialProvider } from './contexts/FinancialContext.jsx';
import { BettingProvider } from './contexts/BettingContext.jsx';
// --- CORREÇÃO: Importação default do ReportScreen (sem chaves) ---
import ReportScreen from './pages/ReportScreen/ReportScreen.jsx'; 

// --- Layout and Pages ---
import SideMenu from './components/SideMenu.jsx';
import LoginScreen from './pages/Login/LoginScreen.jsx';
import DashboardScreen from './pages/Dashboard/DashboardScreen.jsx';
import ChartsScreen from './pages/ChartScreen/ChartsScreen.jsx';
import TransactionScreen from './pages/TransactionHistory/TransactionScreen.jsx'; 
import InvestmentProfile from './pages/InvestmentProfile/InvestmentProfile.jsx';
import TransactionHistoryScreen from './pages/TransactionHistory/TransactionHistoryScreen.jsx';
import ProfileScreen from './pages/Profile/profileScreen.jsx';
import ObjectivesScreen from './pages/Objectives/ObjectiveScreen.jsx';

const AppLayout = () => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <SideMenu />
    <main style={{ flex: 1, backgroundColor: '#121212', overflowY: 'auto' }}>
      <Outlet />
    </main>
  </div>
);

const PrivateRoutes = () => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: 'white' }}>
        <h2>Carregando...</h2>
      </div>
    );
  }

  return user ? <AppLayout /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <FinancialProvider>   
        <SideMenuProvider>
        <BettingProvider>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />

            {/* Rotas Privadas */}
            <Route element={<PrivateRoutes />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route path="/charts" element={<ChartsScreen />} />
              <Route path="/transaction" element={<TransactionScreen />} />
              <Route path="/report" element={<ReportScreen />} />
              <Route path="/objectives" element={<ObjectivesScreen />} />
              <Route path="/investment-profile" element={<InvestmentProfile />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/history" element={<TransactionHistoryScreen />} />
            </Route>

            {/* Rota para páginas não encontradas */}
            <Route path="*" element={
              <div style={{ padding: '50px', color: 'white', height: '100vh' }}>
                <h1>404 - Página Não Encontrada</h1>
              </div>
            } />
          </Routes>
        </BettingProvider>
        </SideMenuProvider>
      </FinancialProvider>
    </AuthProvider>
  );
}

export default App;