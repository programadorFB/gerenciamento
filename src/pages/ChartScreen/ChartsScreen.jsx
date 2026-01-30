import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { useNavigate } from 'react-router-dom';

// --- Charting Library Imports ---
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';

// --- Icons ---
import {
  FaArrowLeft,
  FaChartLine,
  FaTrophy,
  FaFire,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { FaChartPie } from 'react-icons/fa6';
import { GiPokerHand, GiDiamonds } from 'react-icons/gi';
import { MdTimeline } from 'react-icons/md';

// --- CSS Module ---
import styles from './ChartsScreen.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler, ArcElement
);

// --- Configurações de Estilo (Theme Elite) ---
const THEME = {
  gold: '#D4AF37',
  goldDim: 'rgba(212, 175, 55, 0.2)',
  red: '#8B0000',
  redDim: 'rgba(139, 0, 0, 0.2)',
  green: '#2E7D32',
  greenDim: 'rgba(46, 125, 50, 0.2)',
  text: '#E0E0E0',
  grid: 'rgba(255, 255, 255, 0.03)'
};

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false // Legenda customizada via HTML/CSS para mais controle
    },
    tooltip: {
      backgroundColor: 'rgba(5, 5, 5, 0.95)',
      titleColor: THEME.gold,
      bodyColor: '#FFF',
      borderColor: '#333',
      borderWidth: 1,
      padding: 12,
      titleFont: { family: 'Cinzel', size: 14 },
      bodyFont: { family: 'Inter', size: 12 },
      displayColors: false,
      callbacks: {
        label: (context) => `Saldo: R$ ${context.parsed.y.toFixed(2)}`
      }
    }
  },
  scales: {
    x: {
      grid: { color: THEME.grid, borderColor: THEME.grid },
      ticks: { color: '#666', font: { family: 'Inter', size: 10 } }
    },
    y: {
      grid: { color: THEME.grid, borderColor: THEME.grid },
      ticks: { 
        color: '#666', 
        font: { family: 'Inter', size: 10 },
        callback: (value) => `R$ ${value}`
      }
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      borderWidth: 2,
      hoverBorderWidth: 3
    }
  }
};

const TABS = [
  { key: 'performance', label: 'Evolução', icon: <MdTimeline /> },
  { key: 'distribution', label: 'Distribuição', icon: <FaChartPie /> },
  { key: 'stats', label: 'Placar', icon: <GiPokerHand /> },
];

const ChartsScreen = () => {
  const { transactions, loading, getEffectiveInitialBalance } = useFinancial();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('performance');
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);

  const initialBalance = getEffectiveInitialBalance();

  // Processamento de Dados
  useEffect(() => {
    if (transactions.length > 0 || initialBalance > 0) {
      const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      let currentBalance = initialBalance;
      const balanceHistory = [initialBalance];
      const labels = ['Início'];
      
      let wins = 0;
      let losses = 0;
      let totalGains = 0;
      let totalLosses = 0;

      sortedTx.forEach(tx => {
        const amount = parseFloat(tx.amount);
        
        // Atualiza saldo
        if (['deposit', 'gains'].includes(tx.type)) {
            currentBalance += Math.abs(amount);
            if (tx.type === 'gains') { wins++; totalGains += Math.abs(amount); }
        } else {
            currentBalance -= Math.abs(amount);
            if (tx.type === 'losses') { losses++; totalLosses += Math.abs(amount); }
        }

        // Pontos para o gráfico
        const dateObj = new Date(tx.date);
        const dateLabel = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        // Evitar labels duplicadas se houver muitas transações no mesmo dia (simplificação visual)
        if (labels[labels.length - 1] !== dateLabel) {
            labels.push(dateLabel);
            balanceHistory.push(currentBalance);
        } else {
            // Atualiza o último valor do dia
            balanceHistory[balanceHistory.length - 1] = currentBalance;
        }
      });

      // Configuração Gráfico de Linha (Ouro)
      const lineData = {
        labels,
        datasets: [
          {
            label: 'Banca',
            data: balanceHistory,
            borderColor: THEME.gold,
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
              gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');
              return gradient;
            },
            borderWidth: 2,
            pointBackgroundColor: '#000',
            pointBorderColor: THEME.gold,
            fill: true,
            tension: 0.4 // Curva suave
          }
        ]
      };

      // Configuração Gráfico de Rosca (Fichas)
      const doughnutData = {
        labels: ['Vitórias', 'Derrotas'],
        datasets: [{
            data: [wins, losses],
            backgroundColor: [THEME.green, THEME.red],
            borderColor: '#050505',
            borderWidth: 5,
            hoverOffset: 4
        }]
      };

      setChartData({ line: lineData, doughnut: doughnutData });
      setStats({
          wins, 
          losses, 
          totalGains, 
          totalLosses,
          winRate: (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0,
          currentBalance,
          netProfit: totalGains - totalLosses
      });
    }
  }, [transactions, initialBalance]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderContent = () => {
    if (loading || !chartData) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Analisando dados da mesa...</p>
            </div>
        );
    }

    switch (selectedTab) {
      case 'performance':
        return (
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
                <div className={styles.chartTitleBlock}>
                    <h2>Evolução Patrimonial</h2>
                    <span className={styles.chartSubtitle}>Histórico de Banca</span>
                </div>
                <div className={styles.chartValueHighlight}>
                    {formatCurrency(stats.currentBalance)}
                </div>
            </div>
            <div className={styles.chartCanvasContainer}>
                <Line data={chartData.line} options={commonOptions} />
            </div>
          </div>
        );

      case 'distribution':
        return (
          <div className={styles.distributionContainer}>
             <div className={styles.chartCard} style={{ alignItems: 'center', textAlign: 'center' }}>
                <h2 className={styles.chartTitleCenter}>Ratio de Resultados</h2>
                <div className={styles.doughnutWrapper}>
                    <Doughnut 
                        data={chartData.doughnut} 
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '75%',
                            plugins: { tooltip: { enabled: false } } // Tooltip customizada ou desativada para visual limpo
                        }} 
                    />
                    {/* Centro da Rosca */}
                    <div className={styles.doughnutCenter}>
                        <div className={styles.winRateValue}>{stats.winRate}%</div>
                        <div className={styles.winRateLabel}>Win Rate</div>
                    </div>
                </div>
                
                {/* Legenda Customizada */}
                <div className={styles.customLegend}>
                    <div className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: THEME.green }}></span>
                        <span>Vitórias ({stats.wins})</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: THEME.red }}></span>
                        <span>Derrotas ({stats.losses})</span>
                    </div>
                </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className={styles.statsLayout}>
            {/* Placar Principal */}
            <div className={styles.scoreboardPanel}>
                <div className={styles.scoreSide}>
                    <span className={styles.scoreLabel}>GREEN</span>
                    <span className={styles.scoreValue} style={{ color: THEME.green }}>{stats.wins}</span>
                    <span className={styles.scoreMoney} style={{ color: THEME.green }}>+{formatCurrency(stats.totalGains)}</span>
                </div>
                <div className={styles.scoreDivider}></div>
                <div className={styles.scoreSide}>
                    <span className={styles.scoreLabel}>RED</span>
                    <span className={styles.scoreValue} style={{ color: THEME.red }}>{stats.losses}</span>
                    <span className={styles.scoreMoney} style={{ color: THEME.red }}>-{formatCurrency(stats.totalLosses)}</span>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ color: THEME.gold }}><FaTrophy /></div>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricLabel}>Taxa de Acerto</span>
                        <span className={styles.metricNumber}>{stats.winRate}%</span>
                    </div>
                </div>
                
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ color: '#00E0FF' }}><GiDiamonds /></div>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricLabel}>Total de Jogos</span>
                        <span className={styles.metricNumber}>{stats.wins + stats.losses}</span>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ color: stats.netProfit >= 0 ? THEME.green : THEME.red }}>
                         {stats.netProfit >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                    </div>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricLabel}>Lucro Líquido</span>
                        <span className={styles.metricNumber} style={{ color: stats.netProfit >= 0 ? THEME.green : THEME.red }}>
                            {formatCurrency(stats.netProfit)}
                        </span>
                    </div>
                </div>
                 <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ color: '#FFA500' }}><FaFire /></div>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricLabel}>Fator de Lucro</span>
                        <span className={styles.metricNumber}>
                            {stats.totalLosses > 0 ? (stats.totalGains / stats.totalLosses).toFixed(2) : '∞'}
                        </span>
                    </div>
                </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FaArrowLeft />
        </button>
        <h1 className={styles.headerTitle}>Sala de Análise</h1>
        <div style={{ width: 32 }}></div>
      </header>

      <div className={styles.navContainer}>
        {TABS.map(tab => (
            <button
              key={tab.key}
              className={`${styles.navButton} ${selectedTab === tab.key ? styles.navButtonActive : ''}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
        ))}
      </div>

      <main className={styles.mainContent}>
        {renderContent()}
      </main>
    </div>
  );
};

export default ChartsScreen;