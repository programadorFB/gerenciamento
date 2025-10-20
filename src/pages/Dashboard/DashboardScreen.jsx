
import React, { useEffect, useMemo } from 'react';
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
import PerformanceChart from '../../components/PerformanceChart';

// --- Icons ---
import { 
    MdAccountBalanceWallet, 
    MdFlag, 
    MdAdd, 
    MdRemove, 
    MdTrendingUp, 
    MdTrendingDown, 
    MdWarning,
    MdRefresh 
} from 'react-icons/md';
import { 
    FaCoins, 
    FaReceipt, 
    FaBullseye, 
    FaShieldAlt, 
    FaChartLine, 
    FaDice, 
    FaFire, 
    FaBalanceScale,
    FaCalendarDay 
} from 'react-icons/fa';

// --- Assets ---
import logo from '../../assets/logo.png';
import background from '../../assets/fundoLuxo.jpg';

// --- Avatares Locais ---
import avatar1 from '../../assets/avatares/1.png';
import avatar2 from '../../assets/avatares/2.png';
import avatar3 from '../../assets/avatares/3.png';
import avatar4 from '../../assets/avatares/4.png';
import avatar5 from '../../assets/avatares/5.png';
import avatar6 from '../../assets/avatares/6.png';

// --- CSS Module ---
import styles from '../../styles/DashboardScreen.module.css';

// --- Avatares ---
const PREDEFINED_AVATARS = [
    { id: 'avatar1', url: avatar1, name: 'Avatar 1' },
    { id: 'avatar2', url: avatar2, name: 'Avatar 2' },
    { id: 'avatar3', url: avatar3, name: 'Avatar 3' },
    { id: 'avatar4', url: avatar4, name: 'Avatar 4' },
    { id: 'avatar5', url: avatar5, name: 'Avatar 5' },
    { id: 'avatar6', url: avatar6, name: 'Avatar 6' }
];

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const { 
        balance, 
        transactions, 
        objectives, 
        refreshData, 
        getRealProfit, 
        getEffectiveInitialBalance, 
        totalLosses,
        totalDeposits,
        totalWithdraws,
        totalGains,
        dailyGains,
        dailyLosses,
        lastResetDate
    } = useFinancial();
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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getProfileIcon = () => {
        if (!bettingProfile?.isInitialized) return null;
        
        const iconName = bettingProfile.iconName || 'dice';
        const color = bettingProfile.color || '#FFD700';
        
        switch(iconName) {
            case 'shield-alt':
            case 'shield':
                return <FaShieldAlt color={color} />;
            case 'fire':
                return <FaFire color={color} />;
            case 'balance-scale':
            case 'balance':
                return <FaBalanceScale color={color} />;
            case 'dice':
            default:
                return <FaDice color={color} />;
        }
    };

    const calculateProfitTarget = () => {
        const riskLevel = bettingProfile?.riskLevel || 5;
        return balance * (riskLevel / 100);
    };

    const calculateDailyProfitProgress = () => {
        const profitTarget = calculateProfitTarget();
        if (profitTarget <= 0) return 0;
        return Math.min((dailyGains / profitTarget) * 100, 100);
    };

    const stopLossMonetaryValue = bettingProfile?.stopLoss || 0;

    const isStopLossTriggered = useMemo(() => {
        if (!stopLossMonetaryValue) return false;
        return dailyLosses >= stopLossMonetaryValue;
    }, [dailyLosses, stopLossMonetaryValue]);

    const stopLossDistance = useMemo(() => {
        if (!stopLossMonetaryValue) return null;
        return stopLossMonetaryValue - dailyLosses;
    }, [dailyLosses, stopLossMonetaryValue]);

    const getAvatarUrl = () => {
        if (!user?.profile_photo) return null;
        const avatar = PREDEFINED_AVATARS.find(a => a.id === user.profile_photo);
        return avatar ? avatar.url : null;
    };

    const avatarUrl = getAvatarUrl();

    const getInitials = () => {
        if (!user?.name) return 'J';
        return user.name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

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
    const dailyProfitProgress = calculateDailyProfitProgress();
    
    const recentTransactions = transactions.slice(-5).reverse();
    const incompleteObjectives = objectives.filter(obj => obj.current_amount < obj.target_amount);
    
    return (
        <div className={styles.dashboardContainer} style={{ backgroundImage: `url(${background})` }}>
            <div className={styles.overlayGradient} />
            
            <header className={styles.header}>
                <button className={styles.menuButton} onClick={openMenu}>
                    <span className={styles.menuIcon}></span>
                </button>
                
                <div className={styles.greetingContainer}>
                    <h1 className={styles.greeting}>
                        Olá, {user?.name || 'Jogador'}!
                        <img src={logo} alt="Logo" className={styles.logoImg} />
                    </h1>
                    
                    <div className={styles.profileWrapper}>
                        <div className={styles.profileAvatarContainer}>
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt="Avatar" 
                                    className={styles.profileAvatar} 
                                />
                            ) : (
                                <div className={`${styles.profileAvatar} ${styles.profileAvatarPlaceholder}`}>
                                    <span>{getInitials()}</span>
                                </div>
                            )}
                        </div>
                        
                        {bettingProfile?.isInitialized && (
                            <div className={styles.profileIconBadge} title={bettingProfile.title}>
                                {getProfileIcon()}
                            </div>
                        )}
                    </div>
                </div>
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

                {/* Gestão de Risco com valores DIÁRIOS */}
                <section className={styles.riskManagementSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Gestão de Risco (Diária)</h2>
                        <button 
                            className={styles.seeAllButton} 
                            onClick={() => navigate('/investment-profile')}
                        >
                            Configurar
                        </button>
                    </div>

                    <div className={styles.riskCardsContainer}>
                        {/* Card Meta de Lucro DIÁRIA */}
                        <div className={styles.riskCard}>
                            <div className={styles.riskCardHeader}>
                                <div className={styles.riskIconWrapper}>
                                    <FaChartLine size={18} color="#4CAF50" />
                                </div>
                                <span className={styles.riskCardTitle}>Win Diário</span>
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
                                                    width: `${dailyProfitProgress}%`,
                                                    backgroundColor: dailyProfitProgress >= 100 ? '#4CAF50' : '#fdb931'
                                                }}
                                            />
                                        </div>
                                        <div className={styles.progressInfo}>
                                            <span className={styles.progressCurrent}>
                                                {formatCurrency(dailyGains)}
                                            </span>
                                            <span className={styles.progressPercent}>
                                                {dailyProfitProgress.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {dailyProfitProgress >= 100 && (
                                        <div className={styles.successBanner}>
                                            <MdFlag size={16} />
                                            <span>Meta do Dia Alcançada! 🎉</span>
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

                        {/* Card Stop Loss DIÁRIO */}
                        <div className={`${styles.riskCard} ${isStopLossTriggered ? styles.stopLossTriggered : ''}`}>
                            <div className={styles.riskCardHeader}>
                                <div className={styles.riskIconWrapper}>
                                    <FaShieldAlt 
                                        size={18} 
                                        color={isStopLossTriggered ? '#F44336' : '#FF9800'} 
                                    />
                                </div>
                                <span className={styles.riskCardTitle}>StopLoss Diário</span>
                            </div>
                            
                            {stopLossMonetaryValue > 0 ? (
                                <>
                                    <div className={styles.riskCardValue}>
                                        <span className={styles.riskMainValue}>
                                            {formatCurrency(stopLossMonetaryValue)}
                                        </span>
                                        <span className={styles.riskPercentage}>
                                            Limite de perda
                                        </span>
                                    </div>
                                    
                                    <div className={styles.progressBarContainer}>
                                        <div className={styles.progressBar}>
                                            <div 
                                                className={styles.progressBarFill}
                                                style={{ 
                                                    width: `${Math.min((dailyLosses / stopLossMonetaryValue) * 100, 100)}%`,
                                                    backgroundColor: isStopLossTriggered 
                                                        ? '#F44336' 
                                                        : (dailyLosses / stopLossMonetaryValue) >= 0.8 
                                                            ? '#FF9800' 
                                                            : '#FDD835'
                                                }}
                                            />
                                        </div>
                                        <div className={styles.progressInfo}>
                                            <span className={styles.progressCurrent}>
                                                {formatCurrency(dailyLosses)}
                                            </span>
                                            <span className={styles.progressPercent}>
                                                {((dailyLosses / stopLossMonetaryValue) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {isStopLossTriggered ? (
                                        <div className={styles.alertBanner}>
                                            <MdWarning size={16} />
                                            <span>Limite do Dia Atingido!</span>
                                        </div>
                                    ) : stopLossDistance && stopLossDistance < stopLossMonetaryValue * 0.2 ? (
                                        <div className={styles.warningBanner}>
                                            <MdWarning size={16} />
                                            <span>Atenção! Faltam {formatCurrency(stopLossDistance)}</span>
                                        </div>
                                    ) : null}
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
                    </div>
                </section>
                
                {/* Seção Resumo Financeiro - TOTAIS GERAIS */}
                <section className={styles.summarySection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Resumo Financeiro (Total)</h2>
                    </div>
                    
                {/* Ações Rápidas */}
                <section className={styles.quickActions}>
                    <button 
                        className={`${styles.actionButton} ${styles.deposit}`} 
                        onClick={() => navigate('/transaction?type=deposit')}
                    >
                        <MdAdd /> Depósito
                    </button>
                    <button 
                        className={`${styles.actionButton} ${styles.withdraw}`} 
                        onClick={() => navigate('/transaction?type=withdraw')}
                    >
                        <MdRemove /> Saque
                    </button>
                    <button 
                        className={`${styles.actionButton} ${styles.gains}`} 
                        onClick={() => navigate('/transaction?type=gains')}
                    >
                        <MdTrendingUp /> Ganhos
                    </button>
                    <button 
                        className={`${styles.actionButton} ${styles.losses}`} 
                        onClick={() => navigate('/transaction?type=losses')}
                    >
                        <MdTrendingDown /> Loss
                    </button>
                </section>
                    <div className={styles.summaryCardUnified}>
                        <div className={styles.summaryRow}>
                            <div className={styles.summaryLabel}>
                                <MdAdd size={22} color="#4CAF50" />
                                <span>Total Depositado</span>
                            </div>
                            <p className={`${styles.summaryValue} ${styles.positive}`}>
                                {formatCurrency(totalDeposits)}
                            </p>
                        </div>

                        <div className={styles.summaryRow}>
                            <div className={styles.summaryLabel}>
                                <MdRemove size={22} color="#F44336" />
                                <span>Total Sacado</span>
                            </div>
                            <p className={`${styles.summaryValue} ${styles.negative}`}>
                                {formatCurrency(totalWithdraws)}
                            </p>
                        </div>

                        <div className={styles.summaryRow}>
                            <div className={styles.summaryLabel}>
                                <MdTrendingUp size={22} color="#FFD700" />
                                <span>Total de Ganhos</span>
                            </div>
                            <p className={`${styles.summaryValue} ${styles.positive}`}>
                                {formatCurrency(totalGains)}
                            </p>
                        </div>

                        <div className={styles.summaryRow}>
                            <div className={styles.summaryLabel}>
                                <MdTrendingDown size={22} color="#FF9800" />
                                <span>Total de Loss</span>
                            </div>
                            <p className={`${styles.summaryValue} ${styles.negative}`}>
                                {formatCurrency(totalLosses)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Gráfico de Performance */}
                <PerformanceChart 
                    transactions={transactions}
                    currentBalance={balance}
                    initialBalance={initialBalance}
                />


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
                            transactions={recentTransactions}
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
                {/* <section className={styles.objectivesList}>
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
                </section> */}
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
