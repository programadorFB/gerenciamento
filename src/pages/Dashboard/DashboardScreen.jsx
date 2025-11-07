import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { CalendarGrid, DayTransactionsModal } from '../../components/CalendarScreen'; // Ajuste o caminho se necessário

// --- Icons ---
import { 
    MdAccountBalanceWallet, MdFlag, MdAdd, MdRemove, 
    MdTrendingUp, MdTrendingDown, MdWarning, MdRefresh 
} from 'react-icons/md';
import { 
    FaCoins, FaReceipt, FaBullseye, FaShieldAlt, 
    FaChartLine, FaDice, FaFire, FaBalanceScale, FaCalendarDay 
} from 'react-icons/fa';
import { 
    IoPlayBack, 
    IoPlayForward,
    IoChevronBack,
    IoChevronForward
} from 'react-icons/io5';


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
import calendarStyles from '../../components/CalendarScreen.module.css'; // Ajuste o caminho se necessário

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

    // --- Estados do Calendário ---
    const [calendarDate, setCalendarDate] = useState(new Date()); 
    const [modalDate, setModalDate] = useState(null);
    const [modalTransactions, setModalTransactions] = useState([]);

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

    // --- Funções de navegação do calendário ---
    const handlePrevMonth = () => {
        setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    };
    const handlePrevYear = () => {
        setCalendarDate(new Date(calendarDate.getFullYear() - 1, calendarDate.getMonth(), 1));
    };
    const handleNextYear = () => {
        setCalendarDate(new Date(calendarDate.getFullYear() + 1, calendarDate.getMonth(), 1));
    };

    // --- Lógica do Calendário ---
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

    const handleDayClick = (date, transactions) => {
        setModalDate(date);
        setModalTransactions(transactions);
    };

    const closeModal = () => {
        setModalDate(null);
        setModalTransactions([]);
    };
    
    // (O restante das suas funções... getAvatarUrl, getInitials, etc.)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(amount || 0);
    };
    
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
    
    const getProfileIcon = () => {
        if (!bettingProfile?.isInitialized) return null;
        const color = '#FFFFFF'; 
        const iconName = bettingProfile.iconName || 'dice';
        switch(iconName) {
            case 'shield-alt': case 'shield': return <FaShieldAlt color={color} />;
            case 'fire': return <FaFire color={color} />;
            case 'balance-scale': case 'balance': return <FaBalanceScale color={color} />;
            case 'dice': default: return <FaDice color={color} />;
        }
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
    const realProfit = getRealProfit(); // Supondo que esta função exista no seu context
    const recentTransactions = transactions.slice(-5).reverse();
    // ... (cálculos de profitTarget, etc.)
    
    // ✅ NOVO: Formatar o nome do mês/ano
    const monthName = calendarDate.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
    });

    return (
        <div className={styles.dashboardContainer}>
            
            <header className={styles.header}>
              {/* ... (Seu cabeçalho existente) ... */}
                <button className={styles.menuButton} onClick={openMenu}>
                    <span className={styles.menuIcon}></span>
                </button>
                <div className={styles.greetingContainer}>
                    <h1 className={styles.greeting}>
                        Olá, {user?.name || 'Jogador'}!
                        <img src={logo} alt="Logo" className={styles.logoImg} />
                    </h1>
                    <div className={styles.profileWrapper}>
                       {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className={styles.profileAvatar} />
                        ) : (
                            <div className={`${styles.profileAvatar} ${styles.profileAvatarPlaceholder}`}>
                                <span>{getInitials()}</span>
                            </div>
                        )}
                        {bettingProfile?.isInitialized && (
                            <div className={styles.profileIconBadge} title={bettingProfile.title}>
                                {getProfileIcon()}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className={styles.scrollView}>
                
                {/* ... (Seção de Saldos - Mantenha seu código original) ... */}
                {/* ... (Seção Gestão de Risco - Mantenha seu código original) ... */}
                {/* ... (Seção Resumo Financeiro - Mantenha seu código original) ... */}

                {/* Gráfico de Performance */}
                <PerformanceChart 
                    transactions={transactions}
                    currentBalance={balance}
                    initialBalance={initialBalance}
                />

                {/* =======================================================
                ✅ ATUALIZADO: Seção do Calendário com Mês/Ano
                =======================================================
                */}
                <section className={styles.calendarSection}>
                    <div className={styles.sectionHeader}>
                        
                        {/* Título e Botões de Navegação agrupados */}
                        <div className={styles.calendarHeaderGroup}>
                            <h2 className={styles.sectionTitle}>Calendário</h2>
                            
                            {/* Controles de Navegação */}
                            <div className={styles.calendarNavControls}>
                                <button 
                                    className={`${calendarStyles.navButton} ${calendarStyles.yearButton}`} 
                                    onClick={handlePrevYear} 
                                    aria-label="Ano anterior"
                                >
                                    <IoPlayBack />
                                </button>
                                <button 
                                    className={calendarStyles.navButton} 
                                    onClick={handlePrevMonth} 
                                    aria-label="Mês anterior"
                                >
                                    <IoChevronBack />
                                </button>
                                
                                {/* ✅ NOVO: Título do Mês/Ano */}
                                <h3 className={styles.calendarMonthTitle}>{monthName}</h3>

                                <button 
                                    className={calendarStyles.navButton} 
                                    onClick={handleNextMonth} 
                                    aria-label="Próximo mês"
                                >
                                    <IoChevronForward />
                                </button>
                                <button 
                                    className={`${calendarStyles.navButton} ${calendarStyles.yearButton}`} 
                                    onClick={handleNextYear} 
                                    aria-label="Próximo ano"
                                >
                                    <IoPlayForward />
                                </button>
                            </div>
                        </div>
                        
                        {/* Botão Tela Cheia (agora alinhado à direita) */}
                        <button 
                            className={styles.seeAllButton} 
                            onClick={() => navigate('/calendar')}
                        >
                            Ver Tela Cheia
                        </button>
                    </div>
                    
                    <CalendarGrid
                        currentDate={calendarDate} // Passa o estado
                        transactionsByDay={transactionsByDay}
                        onDayClick={handleDayClick}
                    />
                </section>
                {/* ======================================================= */}


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
            </main>

            <SideMenu />

            {/* Modal do Calendário */}
            <DayTransactionsModal
                date={modalDate}
                transactions={modalTransactions}
                onClose={closeModal}
            />
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