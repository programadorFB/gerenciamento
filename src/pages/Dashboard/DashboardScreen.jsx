import React, { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Contexts ---
import { useAuth } from '../../contexts/AuthContext';
import { useFinancial } from '../../contexts/FinancialContext';
import { BettingProvider, useBetting } from '../../contexts/BettingContext'; 
import { useSideMenu } from '../../contexts/SideMenuContext';

// --- Components ---
import SideMenu from '../../components/SideMenu';
import TransactionList from '../../components/TransactionList';
import ObjectivesList from '../../components/ObjectivesList';

// --- Icons ---
import { MdAccountBalanceWallet, MdFlag, MdAdd, MdRemove, MdTrendingUp, MdTrendingDown, MdWarning } from 'react-icons/md';
import { FaCoins, FaReceipt, FaBullseye, FaShieldAlt, FaChartLine } from 'react-icons/fa';

// --- Assets ---
import logo from '../../assets/logo.png';
import background from '../../assets/fundoLuxo.jpg';

// --- CSS Module ---
import styles from '../../styles/DashboardScreen.module.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const { balance, transactions, objectives, refreshData, getRealProfit, getEffectiveInitialBalance } = useFinancial();
    const { bettingProfile } = useBetting(); 
    const { openMenu } = useSideMenu();

    useEffect(() => {
        if (!isLoading && !user) {
            navigate('/login');
        }
    }, [user, isLoading, navigate]);

    useEffect(() => {
        if (user) {
            refreshData();
        }
    }, [user, refreshData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(amount || 0);
    };

    // Calcula a meta de lucro baseada no nível de risco
    const calculateProfitTarget = () => {
        const initialBalance = getEffectiveInitialBalance();
        const riskLevel = bettingProfile?.riskLevel || 5;
        return initialBalance * (riskLevel / 100);
    };

    // Calcula o progresso até atingir a meta
    const calculateProfitProgress = () => {
        const realProfit = getRealProfit();
        const profitTarget = calculateProfitTarget();
        if (profitTarget <= 0) return 0;
        return Math.min((realProfit / profitTarget) * 100, 100);
    };

    // --- LÓGICA DO STOP LOSS MODIFICADA ---
    const stopLossMonetaryValue = bettingProfile?.stopLoss || 0;

    const isStopLossTriggered = useMemo(() => {
        if (!stopLossMonetaryValue) return false;
        const initialBalance = getEffectiveInitialBalance();
        const currentLoss = Math.max(0, initialBalance - balance);
        return currentLoss >= stopLossMonetaryValue;
    }, [balance, getEffectiveInitialBalance, stopLossMonetaryValue]);

    const stopLossDistance = useMemo(() => {
        if (!stopLossMonetaryValue) return null;
        const initialBalance = getEffectiveInitialBalance();
        const currentLoss = Math.max(0, initialBalance - balance);
        return stopLossMonetaryValue - currentLoss;
    }, [balance, getEffectiveInitialBalance, stopLossMonetaryValue]);


    if (isLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <p>Carregando...</p>
            </div>
        );
    }

    const initialBalance = getEffectiveInitialBalance();
    const overallProfit = balance - initialBalance;
    const realProfit = getRealProfit();
    const profitTarget = calculateProfitTarget();
    const profitProgress = calculateProfitProgress();
    
    const recentTransactions = transactions.slice(-5).reverse();
    const incompleteObjectives = objectives.filter(obj => obj.current_amount < obj.target_amount);
    
    return (
        <div className={styles.dashboardContainer} style={{ backgroundImage: `url(${background})` }}>
            <div className={styles.overlayGradient} />
            
            <header className={styles.header}>
                <button className={styles.menuButton} onClick={openMenu}>
                    <span className={styles.menuIcon}></span>
                </button>
                <h1 className={styles.greeting}>Olá, {user?.name || 'Jogador'}!</h1>
                <img src={logo} alt="Logo" className={styles.logoImg} />
            </header>

            <main className={styles.scrollView}>
                {/* Seção de Saldos */}
                <section className={styles.balanceSection}>
                    <div className={styles.balanceCard}>
                        <div className={styles.cardHeader}>
                            <MdAccountBalanceWallet size={20} color="#4CAF50" />
                            <span>Banca Inicial</span>
                        </div>
                        <p className={`${styles.balanceAmount} ${styles.initial}`}>
                            {formatCurrency(initialBalance)}
                        </p>
                    </div>

                    <div className={`${styles.balanceCard} ${styles.main}`}>
                        <div className={styles.cardHeader}>
                            <FaCoins size={20} color="#fdb931" />
                            <span>Saldo Atual</span>
                        </div>
                        <p className={`${styles.balanceAmount} ${styles.main}`}>
                            {formatCurrency(balance)}
                        </p>
                        <div className={`${styles.performance} ${overallProfit >= 0 ? styles.positive : styles.negative}`}>
                            {overallProfit >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(overallProfit))}
                        </div>
                    </div>

                    <div className={styles.balanceCard}>
                        <div className={styles.cardHeader}>
                            <MdFlag size={20} color="#d1b464" />
                            <span>Lucro Real</span>
                        </div>
                        <p className={`${styles.balanceAmount} ${realProfit >= 0 ? styles.positive : styles.negative}`}>
                            {formatCurrency(realProfit)}
                        </p>
                    </div>
                </section>

                {/* Nova Seção: Gestão de Risco */}
                <section className={styles.riskManagementSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Gestão de Risco</h2>
                        <button 
                            className={styles.seeAllButton} 
                            onClick={() => navigate('/investment-profile')}
                        >
                            Configurar
                        </button>
                    </div>

                    <div className={styles.riskCardsContainer}>
                        {/* Card Stop Loss Simplificado */}
                        <div className={`${styles.riskCard} ${isStopLossTriggered ? styles.stopLossTriggered : ''}`}>
                            <div className={styles.riskCardHeader}>
                                <div className={styles.riskIconWrapper}>
                                    <FaShieldAlt 
                                        size={18} 
                                        color={isStopLossTriggered ? '#F44336' : '#FF9800'} 
                                    />
                                </div>
                                <span className={styles.riskCardTitle}>StopLoss</span>
                            </div>
                            
                            {/* LÓGICA DE EXIBIÇÃO MODIFICADA */}
                            {stopLossMonetaryValue > 0 ? (
                                <>
                                    <div className={styles.riskCardValue}>
                                        <span className={styles.riskMainValue}>
                                            {formatCurrency(stopLossMonetaryValue)}
                                        </span>
                                    </div>
                                    
                                    {isStopLossTriggered ? (
                                        <div className={styles.alertBanner}>
                                            <MdWarning size={16} />
                                            <span>Limite Atingido!</span>
                                        </div>
                                    ) : (
                                        <div className={styles.riskDistance}>
                                            <span className={styles.distanceLabel}>Margem atual:</span>
                                            <span className={`${styles.distanceValue} ${
                                                stopLossDistance && stopLossDistance < initialBalance * 0.1 
                                                    ? styles.dangerZone 
                                                    : ''
                                            }`}>
                                                {formatCurrency(stopLossDistance)}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={styles.riskCardEmpty}>
                                    <p>Não configurado</p>
                                    <button 
                                        className={styles.configureButton}
                                        onClick={() => navigate('/investment-profile')}
                                    >
                                        Configurar agora
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Card Meta de Lucro */}
                        <div className={styles.riskCard}>
                            <div className={styles.riskCardHeader}>
                                <div className={styles.riskIconWrapper}>
                                    <FaChartLine size={18} color="#4CAF50" />
                                </div>
                                <span className={styles.riskCardTitle}>Meta de Lucro</span>
                            </div>
                            
                            {bettingProfile?.riskLevel && bettingProfile.riskLevel > 0 ? (
                                <>
                                    <div className={styles.riskCardValue}>
                                        <span className={styles.riskMainValue}>
                                            {formatCurrency(profitTarget)}
                                        </span>
                                        <span className={styles.riskPercentage}>
                                            {bettingProfile.riskLevel}% da banca
                                        </span>
                                    </div>
                                    
                                    <div className={styles.progressBarContainer}>
                                        <div className={styles.progressBar}>
                                            <div 
                                                className={styles.progressBarFill}
                                                style={{ 
                                                    width: `${profitProgress}%`,
                                                    backgroundColor: profitProgress >= 100 ? '#4CAF50' : '#fdb931'
                                                }}
                                            />
                                        </div>
                                        <div className={styles.progressInfo}>
                                            <span className={styles.progressCurrent}>
                                                {formatCurrency(realProfit)}
                                            </span>
                                            <span className={styles.progressPercent}>
                                                {profitProgress.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {profitProgress >= 100 && (
                                        <div className={styles.successBanner}>
                                            <MdFlag size={16} />
                                            <span>Meta Alcançada! 🎉</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={styles.riskCardEmpty}>
                                    <p>Defina seu perfil de risco</p>
                                    <button 
                                        className={styles.configureButton}
                                        onClick={() => navigate('/investment-profile')}
                                    >
                                        Definir perfil
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                
                {/* Ações Rápidas */}
                <section className={styles.quickActions}>
                    <button 
                        className={`${styles.actionButton} ${styles.deposit}`} 
                        onClick={() => navigate('/transaction')}
                    >
                        <MdAdd /> Depósito
                    </button>
                    <button 
                        className={`${styles.actionButton} ${styles.withdraw}`} 
                        onClick={() => navigate('/transaction')}
                    >
                        <MdRemove /> Saque
                    </button>
                    <button 
                        className={`${styles.actionButton} ${styles.gains}`} 
                        onClick={() => navigate('/transaction')}
                    >
                        <MdTrendingUp /> Ganhos
                    </button>
                    <button 
                        className={`${styles.actionButton} ${styles.losses}`} 
                        onClick={() => navigate('/transaction')}
                    >
                        <MdTrendingDown /> Perdas
                    </button>
                </section>

                {/* Transações Recentes */}
                <section className={styles.transactionsList}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Transações Recentes</h2>
                        <button 
                            className={styles.seeAllButton} 
                            onClick={() => navigate('/history')}
                        >
                            Ver Todas
                        </button>
                    </div>
                    {recentTransactions.length > 0 ? (
                       <TransactionList 
                            transactions={transactions}
                            emptyMessage="Nenhuma transação encontrada"
                            />
                    ) : (
                        <div className={styles.emptyState}>
                            <FaReceipt size={40} />
                            <p>Nenhuma transação ainda.</p>
                        </div>
                    )}
                </section>

                {/* Objetivos Ativos */}
                <section className={styles.objectivesList}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Objetivos Ativos</h2>
                        <button 
                            className={styles.seeAllButton} 
                            onClick={() => navigate('/objectives')}
                        >
                            Gerenciar
                        </button>
                    </div>
                    {incompleteObjectives.length > 0 ? (
                        <ObjectivesList objectives={incompleteObjectives.slice(0, 3)} />
                    ) : (
                        <div className={styles.emptyState}>
                            <FaBullseye size={40} />
                            <p>Nenhum objetivo ativo.</p>
                        </div>
                    )}
                </section>
            </main>

            <SideMenu />
        </div>
    );
};

// Wrapper com Provider do Betting Context
const DashboardWithProvider = () => {
    return (
        <BettingProvider>
            <Dashboard />
        </BettingProvider>
    );
};

export default DashboardWithProvider;