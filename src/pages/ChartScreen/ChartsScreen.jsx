import React, { useState, useEffect, useMemo } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { useNavigate } from 'react-router-dom';

// --- Charting Library Imports ---
import { Line, Scatter, Doughnut } from 'react-chartjs-2';
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
  FaShieldAlt,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { FaArrowTrendUp, FaChartPie } from 'react-icons/fa6';
import { GiDiamonds, GiPokerHand } from 'react-icons/gi';

// --- CSS Module ---
import styles from './ChartsScreen.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler, ArcElement
);

// --- Configurações de Estilo do Gráfico (Dark Mode) ---
const CHART_COLORS = {
  gold: '#D4AF37',
  green: '#00FF88',
  red: '#FF4D4D',
  grid: 'rgba(255, 255, 255, 0.05)',
  text: '#B0B8C3'
};

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#FFF', font: { family: 'Montserrat', size: 11 } }
    },
    tooltip: {
      backgroundColor: 'rgba(21, 25, 30, 0.95)',
      titleColor: '#D4AF37',
      bodyColor: '#FFF',
      borderColor: '#333',
      borderWidth: 1,
      padding: 10,
      titleFont: { family: 'Cinzel', size: 13 },
      bodyFont: { family: 'Montserrat' }
    }
  },
  scales: {
    x: {
      grid: { color: CHART_COLORS.grid },
      ticks: { color: CHART_COLORS.text, font: { size: 10 } }
    },
    y: {
      grid: { color: CHART_COLORS.grid },
      ticks: { color: CHART_COLORS.text, font: { size: 10 } }
    }
  }
};

const CHART_TYPES = [
  { key: 'performance', label: 'Evolução', icon: <FaArrowTrendUp /> },
  { key: 'distribution', label: 'Distribuição', icon: <FaChartPie /> },
  { key: 'stats', label: 'Placar', icon: <GiPokerHand /> },
];

const ChartsScreen = () => {
  const { transactions, loading, getEffectiveInitialBalance } = useFinancial();
  const navigate = useNavigate();
  const [selectedChart, setSelectedChart] = useState('performance');
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);

  const initialBalance = getEffectiveInitialBalance();

  // Processamento de Dados
  useEffect(() => {
    if (transactions.length > 0) {
      const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      let currentBalance = initialBalance;
      const balanceHistory = [];
      const labels = [];
      const scatterPoints = []; // Para vitórias/derrotas
      
      let wins = 0;
      let losses = 0;
      let totalGains = 0;
      let totalLosses = 0;

      // Adiciona ponto inicial
      labels.push('Início');
      balanceHistory.push(initialBalance);

      sortedTx.forEach(tx => {
        const amount = parseFloat(tx.amount);
        const isGain = ['deposit', 'gains'].includes(tx.type) || (!tx.type && amount >= 0);
        
        // Atualiza saldo
        if (['deposit', 'gains'].includes(tx.type)) {
            currentBalance += Math.abs(amount);
            if (tx.type === 'gains') { wins++; totalGains += Math.abs(amount); }
        } else {
            currentBalance -= Math.abs(amount);
            if (tx.type === 'losses') { losses++; totalLosses += Math.abs(amount); }
        }

        // Pontos para o gráfico
        const dateLabel = new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        labels.push(dateLabel);
        balanceHistory.push(currentBalance);

        // Pontos de Scatter (apenas jogadas)
        if (tx.type === 'gains' || tx.type === 'losses') {
            scatterPoints.push({
                x: dateLabel,
                y: Math.abs(amount),
                type: tx.type
            });
        }
      });

      // Configuração do Gráfico de Linha (Performance)
      const lineData = {
        labels,
        datasets: [
          {
            label: 'Banca Total',
            data: balanceHistory,
            borderColor: CHART_COLORS.gold,
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#000',
            pointBorderColor: CHART_COLORS.gold,
            pointRadius: 3,
            tension: 0.3,
            fill: true,
          }
        ]
      };

      // Configuração do Gráfico de Rosca (Win/Loss)
      const doughnutData = {
        labels: ['Vitórias', 'Derrotas'],
        datasets: [{
            data: [wins, losses],
            backgroundColor: [CHART_COLORS.green, CHART_COLORS.red],
            borderColor: '#0F1216',
            borderWidth: 4,
            hoverOffset: 10
        }]
      };

      setChartData({ line: lineData, doughnut: doughnutData });
      setStats({
          wins, 
          losses, 
          totalGains, 
          totalLosses,
          winRate: (wins + losses) > 0 ? (wins / (wins + losses) * 100).toFixed(1) : 0,
          currentBalance
      });
    }
  }, [transactions, initialBalance]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderContent = () => {
    if (loading || !chartData) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Carregando dados da mesa...</p>
            </div>
        );
    }

    switch (selectedChart) {
      case 'performance':
        return (
          <div className={styles.chartWrapper}>
            <div className={styles.chartTitleArea}>
                <h2><FaChartLine /> Evolução da Banca</h2>
                <span style={{color: '#FFF', fontWeight: 'bold'}}>{formatCurrency(stats.currentBalance)}</span>
            </div>
            <div style={{height: '300px'}}>
                <Line data={chartData.line} options={commonOptions} />
            </div>
          </div>
        );

      case 'distribution':
        return (
          <div className={styles.chartWrapper} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
             <div className={styles.chartTitleArea} style={{width: '100%'}}>
                <h2><FaChartPie /> Distribuição de Resultados</h2>
            </div>
            <div style={{height: '300px', width: '300px', position: 'relative'}}>
                <Doughnut 
                    data={chartData.doughnut} 
                    options={{
                        ...commonOptions, 
                        cutout: '70%',
                        plugins: { legend: { position: 'bottom', labels: { color: '#FFF' } } }
                    }} 
                />
                {/* Texto central da rosca */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)',
                    textAlign: 'center', color: '#FFF'
                }}>
                    <div style={{fontSize: '24px', fontWeight: 'bold'}}>{stats.winRate}%</div>
                    <div style={{fontSize: '10px', color: '#888'}}>Win Rate</div>
                </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <>
            <div className={styles.chartTitleArea}>
                <h2><GiDiamonds /> Estatísticas da Sessão</h2>
            </div>
            
            <div className={styles.casinoScoreboard}>
                <div className={`${styles.scoreSide} ${styles.scoreWins}`}>
                    <span className={styles.scoreLabel}>VITÓRIAS</span>
                    <span className={`${styles.scoreValue} ${styles.win}`}>{stats.wins}</span>
                    <span className={styles.statSubtext} style={{color: CHART_COLORS.green}}>
                        {formatCurrency(stats.totalGains)}
                    </span>
                </div>
                <div className={`${styles.scoreSide} ${styles.scoreLosses}`}>
                    <span className={styles.scoreLabel}>DERROTAS</span>
                    <span className={`${styles.scoreValue} ${styles.loss}`}>{stats.losses}</span>
                    <span className={styles.statSubtext} style={{color: CHART_COLORS.red}}>
                        -{formatCurrency(stats.totalLosses)}
                    </span>
                </div>
            </div>

            <div className={styles.statsGrid} style={{marginTop: '20px'}}>
                <div className={styles.casinoStatCard} style={{'--stat-color': CHART_COLORS.gold}}>
                    <span className={styles.statLabel}><FaTrophy /> Taxa de Acerto</span>
                    <span className={styles.statValue}>{stats.winRate}%</span>
                </div>
                <div className={styles.casinoStatCard} style={{'--stat-color': '#00E0FF'}}>
                    <span className={styles.statLabel}><FaFire /> Total de Jogos</span>
                    <span className={styles.statValue}>{stats.wins + stats.losses}</span>
                </div>
                <div className={styles.casinoStatCard} style={{'--stat-color': CHART_COLORS.green}}>
                    <span className={styles.statLabel}><FaArrowUp /> Lucro Líquido</span>
                    <span className={styles.statValue} style={{color: (stats.totalGains - stats.totalLosses) >= 0 ? CHART_COLORS.green : CHART_COLORS.red}}>
                        {formatCurrency(stats.totalGains - stats.totalLosses)}
                    </span>
                </div>
            </div>
          </>
        );

      default: return null;
    }
  };

  return (
    <div className={styles.casinoContainer}>
      <header className={styles.casinoHeader}>
        <button onClick={() => navigate(-1)} className={styles.casinoBackButton}>
          <FaArrowLeft /> VOLTAR À MESA
        </button>

        <div className={styles.casinoNav}>
          {CHART_TYPES.map(chart => (
            <button
              key={chart.key}
              className={`${styles.casinoNavButton} ${selectedChart === chart.key ? styles.casinoNavActive : ''}`}
              onClick={() => setSelectedChart(chart.key)}
            >
              {chart.icon}
              <span>{chart.label}</span>
              {selectedChart === chart.key && <div className={styles.activeGlow}></div>}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.casinoMain}>
        {renderContent()}
      </main>
    </div>
  );
};

export default ChartsScreen;