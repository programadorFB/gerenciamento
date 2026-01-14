import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Contexts ---
import { useAuth } from '../../contexts/AuthContext';
import { useFinancial } from '../../contexts/FinancialContext';
import { BettingProvider, useBetting } from '../../contexts/BettingContext'; 
import { useSideMenu } from '../../contexts/SideMenuContext';
import apiService from '../../services/api';

// --- Components ---
import SideMenu from '../../components/SideMenu';
import TransactionList from '../../components/TransactionList';
// import ObjectivesList from '../../components/ObjectivesList'; // Opcional
// import PerformanceChart from '../../components/PerformanceChart'; // Opcional
import { CalendarGrid, DayTransactionsModal } from '../../components/CalendarScreen';

// --- Icons (Atualizados para react-icons/io5 e fa para consistência) ---
import { 
    MdAccountBalanceWallet, 
    MdFlag, 
    MdRefresh,
    MdWarning
} from 'react-icons/md';
import { 
    FaCoins, 
    FaReceipt, 
    FaShieldAlt, 
    FaChartLine, 
    FaDice, 
    FaFire, 
    FaBalanceScale,
    FaPlus,
    FaMinus,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa';

// --- Assets ---
import logo from '../../assets/logo.png';

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
        dailyLosses
    } = useFinancial();
    
    const initialBalance = getEffectiveInitialBalance();
    const { bettingProfile } = useBetting(); 
    const { openMenu } = useSideMenu();

    // Estados
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [modalDate, setModalDate] = useState(null);
    const [modalTransactions, setModalTransactions] = useState([]);
    const [showResetModal, setShowResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

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

    const transactionsByDay = useMemo(() => {
        const map = {};
        transactions.forEach(tx => {
            try {
                const dateKey = new Date(tx.date).toISOString().split('T')[0];
                if (!map[dateKey]) {
                map[dateKey] = [];
                }
                map[dateKey].push(tx);
            } catch (e) {
                console.error("Transação com data inválida:", tx);
            }
        });
        return map;
    }, [transactions]);

    const handleQuickEditInitial = async () => {
        const initialTx = transactions.find(tx => 
            tx.is_initial_bank === true || 
            tx.description?.toLowerCase().includes('inicial') ||
            tx.category?.toLowerCase().includes('inicial')
        );
        
        if (!initialTx) {
            alert("Não encontramos a transação de banca inicial. Tente resetar o histórico.");
            return;
        }
        
        const newValue = prompt(`Editando Banca Inicial:\nValor atual: R$ ${initialTx.amount}`, initialTx.amount);

        if (newValue !== null && newValue !== "" && !isNaN(newValue.replace(',', '.'))) {
            try {
                const numericValue = parseFloat(newValue.replace(',', '.'));
                const response = await apiService.updateTransaction(initialTx.id, {
                    amount: numericValue,
                    description: initialTx.description
                });

                if (response.success) {
                    if (refreshData) await refreshData(); 
                } else {
                    alert(`Erro: ${response.error}`);
                }
            } catch (e) {
                alert("Erro ao conectar com o servidor.");
            }
        }
    };

    const handleConfirmReset = async () => {
        setIsResetting(true);
        try {
            const response = await apiService.forceResetBank();
            if (response.success) {
                if (refreshData) await refreshData();
                setShowResetModal(false);
            } else {
                alert(`Erro: ${response.error}`);
            }
        } catch (error) {
            alert('Erro ao conectar com o servidor.');
        } finally {
            setIsResetting(false);
        }
    };

    const handleDayClick = (date, transactions) => {
        setModalDate(date);
        setModalTransactions(transactions);
    };

    const closeModal = () => {
        setModalDate(null);
        setModalTransactions([]);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(amount || 0);
    };

    const getProfileIcon = () => {
        if (!bettingProfile?.isInitialized) return null;
        const color = '#D4AF37'; 
        const iconName = bettingProfile.iconName || 'dice';
        
        switch(iconName) {
            case 'shield-alt': return <FaShieldAlt color={color} />;
            case 'fire': return <FaFire color={color} />;
            case 'balance-scale': return <FaBalanceScale color={color} />;
            default: return <FaDice color={color} />;
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

    const stopLossMonetaryValue = useMemo(() => {
        if (bettingProfile?.stopLossPercentage && bettingProfile.stopLossPercentage > 0) {
            return initialBalance * (bettingProfile.stopLossPercentage / 100);
        }
        if (bettingProfile?.stopLoss && bettingProfile.stopLoss > 0) {
            return bettingProfile.stopLoss;
        }
        return 0;
    }, [bettingProfile, initialBalance]);

    const isStopLossTriggered = useMemo(() => {
        if (!stopLossMonetaryValue || stopLossMonetaryValue <= 0) return false;
        return dailyLosses >= stopLossMonetaryValue;
    }, [dailyLosses, stopLossMonetaryValue]);

    const stopLossDistance = useMemo(() => {
        if (!stopLossMonetaryValue) return null;
        return stopLossMonetaryValue - dailyLosses;
    }, [dailyLosses, stopLossMonetaryValue]);

    const avatarUrl = useMemo(() => {
        if (!user?.profile_photo) return null;
        const avatar = PREDEFINED_AVATARS.find(a => a.id === user.profile_photo);
        return avatar ? avatar.url : null;
    }, [user]);

    const getInitials = () => {
        if (!user?.name) return 'PL';
        return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const overallProfit = balance - initialBalance;
    const realProfit = getRealProfit();
    const profitTarget = calculateProfitTarget();
    const dailyProfitProgress = calculateDailyProfitProgress();
    const recentTransactions = transactions.slice(-5).reverse();

    if (isLoading || !user) return <div className={styles.emptyState}>Carregando mesa...</div>;

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <button className={styles.menuButton} onClick={openMenu}>
                    <span className={styles.menuIcon}></span>
                </button>
                
                <div className={styles.greetingContainer}>
                    <div className={styles.greeting}>
                        {user?.name || 'Jogador'}
                        <img src={logo} alt="Logo" className={styles.logoImg} />
                    </div>
                    
                    <div className={styles.profileWrapper} onClick={() => navigate('/profile')}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className={styles.profileAvatar} />
                        ) : (
                            <div className={`${styles.profileAvatar} ${styles.profileAvatarPlaceholder}`}>
                                <span>{getInitials()}</span>
                            </div>
                        )}
                        {bettingProfile?.isInitialized && (
                            <div className={styles.profileIconBadge}>
                                {getProfileIcon()}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className={styles.scrollView}>
                
                {/* SALDOS (Plaquetas VIP) */}
                <section className={styles.balanceSection}>
                    <div 
                        className={styles.balanceCard} 
                        onClick={handleQuickEditInitial} 
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.cardHeader}>
                            <MdAccountBalanceWallet /> <span>Banca Inicial</span>
                        </div>
                        <p className={`${styles.balanceAmount} ${styles.initial}`}>
                            {formatCurrency(initialBalance)}
                        </p>
                    </div>

                    <div className={`${styles.balanceCard} ${styles.main}`}>
                        <div className={styles.cardHeader}>
                            <FaCoins /> <span>Saldo Atual</span>
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
                            <MdFlag /> <span>Lucro Real</span>
                        </div>
                        <p className={`${styles.balanceAmount} ${realProfit >= 0 ? styles.positive : styles.negative}`}>
                            {formatCurrency(realProfit)}
                        </p>
                    </div>
                </section>

                {/* PAINÉIS DE ESTATÍSTICA (Cards Escuros) */}
                <section className={styles.riskManagementSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Performance do Dia</h2>
                        <button className={styles.seeAllButton} onClick={() => navigate('/investment-profile')}>
                            Ajustar
                        </button>
                    </div>

                    <div className={styles.riskCardsContainer}>
                        {/* Meta de Lucro */}
                        <div className={styles.riskCard}>
                            <div className={styles.riskCardHeader}>
                                <FaChartLine color="#FFF" />
                                <span className={styles.riskCardTitle}>Meta de Win</span>
                            </div>
                            <div className={styles.riskCardBody}>
                                {bettingProfile?.riskLevel > 0 ? (
                                    <>
                                        <div className={styles.riskCardValue}>
                                            <span className={styles.riskMainValue}>{formatCurrency(profitTarget)}</span>
                                            <span className={styles.riskPercentage}>{bettingProfile.riskLevel}% da banca</span>
                                        </div>
                                        <div className={styles.progressBarContainer}>
                                            <div className={styles.progressBar}>
                                                <div 
                                                    className={styles.progressBarFill} 
                                                    style={{ width: `${dailyProfitProgress}%` }} 
                                                />
                                            </div>
                                            <div className={styles.progressInfo}>
                                                <span>{formatCurrency(dailyGains)}</span>
                                                <span>{dailyProfitProgress.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.riskCardEmpty}>
                                        <p>Perfil não definido</p>
                                        <button className={styles.configureButton} onClick={() => navigate('/investment-profile')}>Configurar</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stop Loss */}
                        <div className={styles.riskCard}>
                            <div className={styles.riskCardHeader}>
                                <FaShieldAlt color="#FFF" />
                                <span className={styles.riskCardTitle}>Limite de Perda</span>
                            </div>
                            <div className={styles.riskCardBody}>
                                {stopLossMonetaryValue > 0 ? (
                                    <>
                                        <div className={styles.riskCardValue}>
                                            <span className={styles.riskMainValue}>{formatCurrency(stopLossMonetaryValue)}</span>
                                            <span className={styles.riskPercentage}>Proteção Ativa</span>
                                        </div>
                                        <div className={styles.progressBarContainer}>
                                            <div className={styles.progressBar}>
                                                <div 
                                                    className={styles.progressBarFill} 
                                                    style={{ 
                                                        width: `${Math.min((dailyLosses / stopLossMonetaryValue) * 100, 100)}%`,
                                                        backgroundColor: isStopLossTriggered ? '#FF4D4D' : '#00FF88'
                                                    }} 
                                                />
                                            </div>
                                            <div className={styles.progressInfo}>
                                                <span style={{ color: '#FF4D4D' }}>-{formatCurrency(dailyLosses)}</span>
                                                <span>{((dailyLosses / stopLossMonetaryValue) * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        {isStopLossTriggered && (
                                            <div className={styles.alertBanner}>
                                                <MdWarning /> <span>Limite Atingido!</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className={styles.riskCardEmpty}>
                                        <p>Sem proteção</p>
                                        <button className={styles.configureButton} onClick={() => navigate('/investment-profile')}>Configurar</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* RESUMO GERAL */}
                <section className={styles.summarySection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Caixa Geral</h2>
                    </div>
                    <div className={styles.summaryCardUnified}>
                        <div className={styles.summaryRow}>
                            <div className={styles.summaryLabel}><FaPlus /> Depósitos</div>
                            <p className={`${styles.summaryValue} ${styles.positive}`}>{formatCurrency(totalDeposits)}</p>
                        </div>
                        <div className={styles.summaryRow}>
                            <div className={styles.summaryLabel}><FaMinus /> Saques</div>
                            <p className={`${styles.summaryValue} ${styles.negative}`}>{formatCurrency(totalWithdraws)}</p>
                        </div>
                        <div className={styles.summaryRow}>
                            <div className={styles.summaryLabel}><FaArrowUp /> Ganhos</div>
                            <p className={`${styles.summaryValue} ${styles.positive}`}>{formatCurrency(totalGains)}</p>
                        </div>
                        <div className={styles.summaryRow}>
                            <div className={styles.summaryLabel}><FaArrowDown /> Perdas</div>
                            <p className={`${styles.summaryValue} ${styles.negative}`}>{formatCurrency(totalLosses)}</p>
                        </div>
                    </div>
                </section>

                {/* AÇÕES RÁPIDAS (Botões de Jogo) */}
                <section className={styles.quickActions}>
                    <button className={styles.actionButton} onClick={() => navigate('/transaction?type=deposit')}>
                        <FaPlus /> Depósito
                    </button>
                    <button className={styles.actionButton} onClick={() => navigate('/transaction?type=withdraw')}>
                        <FaMinus /> Saque
                    </button>
                    <button className={styles.actionButton} onClick={() => navigate('/transaction?type=gains')}>
                        <FaArrowUp /> Win
                    </button>
                    <button className={styles.actionButton} onClick={() => navigate('/transaction?type=losses')}>
                        <FaArrowDown /> Loss
                    </button>
                </section>

                {/* CALENDÁRIO */}
                <section className={styles.calendarSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Histórico Diário</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                className={styles.seeAllButton} 
                                onClick={() => setShowResetModal(true)}
                                style={{ color: '#FF4D4D', borderColor: '#FF4D4D' }}
                            >
                                <MdRefresh /> Reset
                            </button>
                            <button className={styles.seeAllButton} onClick={() => navigate('/calendar')}>
                                Expandir
                            </button>
                        </div>
                    </div>
                    <CalendarGrid
                        currentDate={calendarDate}
                        transactionsByDay={transactionsByDay}
                        onDayClick={handleDayClick}
                    />
                </section>

                {/* TRANSAÇÕES RECENTES */}
                <section className={styles.transactionsList}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Últimas Rodadas</h2>
                        <button className={styles.seeAllButton} onClick={() => navigate('/history')}>
                            Ver Tudo
                        </button>
                    </div>
                    {recentTransactions.length > 0 ? (
                       <TransactionList 
                            transactions={recentTransactions}
                            emptyMessage="Sem registros"
                        />
                    ) : (
                        <div className={styles.emptyState}>
                            <FaReceipt size={30} style={{marginBottom: 10}} />
                            <p>Nenhuma jogada recente.</p>
                        </div>
                    )}
                </section>
            </main>

            <SideMenu />

            <DayTransactionsModal
                date={modalDate}
                transactions={modalTransactions}
                onClose={closeModal}
            />

            {showResetModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.resetModalContainer} style={{ background: '#15191E', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid #FF4D4D' }}>
                        <h2 style={{ color: '#FFF', marginBottom: '16px', fontFamily: 'Cinzel, serif' }}>⚠️ Reiniciar Mesa?</h2>
                        <p style={{ color: '#B0B8C3', marginBottom: '24px', fontSize: '13px', lineHeight: '1.5' }}>
                            Isso apagará <strong>todos os registros</strong> e restaurará a banca inicial. Esta ação é irreversível.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => setShowResetModal(false)}
                                style={{ flex: 1, background: '#2C333A', color: '#FFF', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                CANCELAR
                            </button>
                            <button 
                                onClick={handleConfirmReset}
                                disabled={isResetting}
                                style={{ flex: 1, background: '#FF4D4D', color: '#FFF', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {isResetting ? 'Limpando...' : 'CONFIRMAR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardWithProvider = () => {
    return (
        <BettingProvider>
            <Dashboard />
        </BettingProvider>
    );
};

export default DashboardWithProvider;