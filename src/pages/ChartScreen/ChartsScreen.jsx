import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

// --- Charting Library Imports ---
import {
  Line,
  Pie,
  Bar,
  Doughnut,
  Scatter,
  Bubble
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  LogarithmicScale
} from 'chart.js';

// --- Icons ---
import {
  FaArrowLeft,
  FaChartPie,
  FaChartLine,
  FaListUl,
  FaMoneyBillWave,
  FaPercentage,
  FaExclamationTriangle,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { FaArrowTrendUp} from 'react-icons/fa6';
// --- CSS Module ---
import styles from './ChartsScreen.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
  TimeScale, LogarithmicScale
);

// --- Constants ---
const PERIODS = [
  { key: '1', label: '1M' },
  { key: '3', label: '3M' },
  { key: '6', label: '6M' },
  { key: '12', label: '1A' },
  { key: 'all', label: 'Tudo' }
];

const CHART_TYPES = [
  { key: 'overview', label: 'Visão Geral', icon: <FaChartPie /> },
  { key: 'performance', label: 'Desempenho', icon: <FaArrowTrendUp /> },
  { key: 'cashflow', label: 'Fluxo de Caixa', icon: <FaMoneyBillWave /> },
  { key: 'categories', label: 'Categorias', icon: <FaListUl /> },
  { key: 'risk', label: 'Risco', icon: <FaExclamationTriangle /> }
];

const ChartsScreen = () => {
  const { transactions } = useFinancial();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('6');
  const [selectedChart, setSelectedChart] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);

  // Configuração de temas para gráficos
  const chartTheme = {
    dark: {
      text: '#FFFFFF',
      grid: '#333333',
      background: '#1A1A1A',
      border: '#444444'
    }
  };

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: chartTheme.dark.text, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#2A2A2A',
        titleColor: '#FFD700',
        bodyColor: '#FFFFFF',
        borderColor: '#FFD700',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== undefined) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendsRes, performanceRes] = await Promise.all([
        apiService.getAnalyticsOverview(),
        apiService.getMonthlyAnalytics(selectedPeriod),
        apiService.getPerformanceStats(selectedPeriod)
      ]);

      if (overviewRes.success) setOverviewData(overviewRes.data);
      if (trendsRes.success) setTrendsData(trendsRes.data.sort((a, b) => new Date(a.month) - new Date(b.month)));
      if (performanceRes.success) setPerformanceData(performanceRes.data);
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Análises estatísticas avançadas
  const statisticalAnalysis = useMemo(() => {
    const operationalTxs = transactions.filter(tx =>
      apiService.isOperationalTransaction(tx.type)
    );

    const gains = operationalTxs.filter(tx => tx.type === 'gains');
    const losses = operationalTxs.filter(tx => tx.type === 'losses');

    const gainAmounts = gains.map(tx => tx.amount);
    const lossAmounts = losses.map(tx => tx.amount);

    // Estatísticas básicas
    const totalGains = gainAmounts.reduce((a, b) => a + b, 0);
    const totalLosses = lossAmounts.reduce((a, b) => a + b, 0);
    const netProfit = totalGains - totalLosses;

    // Estatísticas avançadas
    const avgGain = gains.length > 0 ? totalGains / gains.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const winRate = operationalTxs.length > 0 ? (gains.length / operationalTxs.length) * 100 : 0;

    // Volatilidade (desvio padrão dos retornos)
    const returns = operationalTxs.map(tx =>
      tx.type === 'gains' ? tx.amount : -tx.amount
    );
    const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / returns.length : 0;
    const volatility = Math.sqrt(variance);

    // Sharpe Ratio simplificado
    const sharpeRatio = volatility > 0 ? (meanReturn / volatility) : 0;

    // Máximas e mínimas
    const maxGain = gains.length > 0 ? Math.max(...gainAmounts) : 0;
    const maxLoss = losses.length > 0 ? Math.max(...lossAmounts) : 0;

    // Sequências
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    operationalTxs.forEach(tx => {
      if (tx.type === 'gains') {
        currentStreak = Math.max(currentStreak + 1, 1);
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else {
        currentStreak = Math.min(currentStreak - 1, -1);
        maxLossStreak = Math.min(maxLossStreak, currentStreak);
      }
    });

    // Drawdown calculation
    let runningBalance = 0;
    let peak = 0;
    let maxDrawdown = 0;

    operationalTxs.forEach(tx => {
      runningBalance += tx.type === 'gains' ? tx.amount : -tx.amount;
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = peak > 0 ? ((peak - runningBalance) / peak) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return {
      totalGains,
      totalLosses,
      netProfit,
      avgGain,
      avgLoss,
      winRate,
      volatility,
      sharpeRatio,
      maxGain,
      maxLoss,
      maxWinStreak: Math.abs(maxWinStreak),
      maxLossStreak: Math.abs(maxLossStreak),
      totalTrades: operationalTxs.length,
      winningTrades: gains.length,
      losingTrades: losses.length,
      profitFactor: totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? Infinity : 0,
      maxDrawdown,
      expectancy: (avgGain * (winRate/100)) - (avgLoss * ((100-winRate)/100))
    };
  }, [transactions]);

  // Dados para gráfico de categorias aprimorado
  const categoryAnalysis = useMemo(() => {
    const categoryStats = transactions.reduce((acc, tx) => {
      const category = tx.category || 'Outros';
      if (!acc[category]) {
        acc[category] = { total: 0, gains: 0, losses: 0, count: 0 };
      }

      if (tx.type === 'gains') {
        acc[category].gains += tx.amount;
        acc[category].total += tx.amount;
      } else if (tx.type === 'losses') {
        acc[category].losses += tx.amount;
        acc[category].total -= tx.amount;
      }
      acc[category].count += 1;

      return acc;
    }, {});

    return Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        ...stats,
        profitability: stats.gains > 0 ? ((stats.gains - stats.losses) / stats.gains) * 100 : 0
      }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [transactions]);

  // Dados para heatmap de performance
  const performanceHeatmapData = useMemo(() => {
    const dailyData = transactions.reduce((acc, tx) => {
      const date = new Date(tx.date).toDateString();
      if (!acc[date]) {
        acc[date] = { date, profit: 0, trades: 0 };
      }

      if (tx.type === 'gains') {
        acc[date].profit += tx.amount;
      } else if (tx.type === 'losses') {
        acc[date].profit -= tx.amount;
      }
      acc[date].trades += 1;

      return acc;
    }, {});

    return Object.values(dailyData);
  }, [transactions]);

  const renderEmptyState = () => (
    <div className={styles.emptyContainer}>
      <FaChartLine size={60} />
      <h2>Nenhum Dado Disponível</h2>
      <p>Adicione transações para ver suas análises.</p>
    </div>
  );

  const renderChartContent = () => {
    if (loading) return <div className={styles.loadingContainer}>Carregando análises...</div>;
    if (transactions.length === 0) return renderEmptyState();

    switch(selectedChart) {
      case 'overview':
        if (!overviewData) return renderEmptyState();

        const profitLoss = parseFloat(overviewData.current_balance) - parseFloat(overviewData.initial_balance);
        const roi = overviewData.initial_balance > 0 ? (profitLoss / parseFloat(overviewData.initial_balance)) * 100 : 0;

        return (
          <div className={styles.overviewGrid}>
            <div className={styles.chartCard}>
              <h3>Distribuição de Capital</h3>
              <div className={styles.chartContainer}>
                <Doughnut
                  data={{
                    labels: ['Banca Inicial', 'Lucro/Prejuízo'],
                    datasets: [{
                      data: [
                        Math.max(0, parseFloat(overviewData.initial_balance)),
                        Math.abs(profitLoss)
                      ],
                      backgroundColor: [
                        '#4CAF50',
                        profitLoss >= 0 ? '#FFD700' : '#F44336'
                      ],
                      borderColor: chartTheme.dark.border,
                      borderWidth: 2
                    }]
                  }}
                  options={{
                    ...baseChartOptions,
                    cutout: '60%',
                    plugins: {
                      ...baseChartOptions.plugins,
                      tooltip: {
                        ...baseChartOptions.plugins.tooltip,
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <FaDollarSign className={styles.statIcon} />
                <p className={styles.statValue}>R$ {parseFloat(overviewData.current_balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={styles.statLabel}>Banca Atual</p>
              </div>
              <div className={styles.statCard}>
                {profitLoss >= 0 ? <FaArrowUp className={styles.statIcon} /> : <FaArrowDown className={styles.statIcon} />}
                <p className={styles.statValue} style={{ color: profitLoss >= 0 ? '#4CAF50' : '#F44336' }}>
                  R$ {Math.abs(profitLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={styles.statLabel}>{profitLoss >= 0 ? 'Lucro Total' : 'Prejuízo Total'}</p>
              </div>
              <div className={styles.statCard}>
                <FaPercentage className={styles.statIcon} />
                <p className={styles.statValue} style={{ color: roi >= 0 ? '#4CAF50' : '#F44336' }}>
                  {roi.toFixed(1)}%
                </p>
                <p className={styles.statLabel}>ROI</p>
              </div>
              <div className={styles.statCard}>
                <FaArrowTrendUp className={styles.statIcon} />
                <p className={styles.statValue}>{statisticalAnalysis.winRate.toFixed(1)}%</p>
                <p className={styles.statLabel}>Win Rate</p>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className={styles.performanceGrid}>
            <div className={styles.chartCard}>
              <h3>Evolução do Patrimônio</h3>
              <div className={styles.chartContainer}>
                <Line
                  data={{
                    labels: trendsData.map(d => new Date(d.month).toLocaleString('default', { month: 'short' })),
                    datasets: [{
                      label: 'Patrimônio Acumulado',
                      data: trendsData.map((d, index) => {
                        const base = parseFloat(overviewData?.initial_balance || 0);
                        const cumulative = trendsData.slice(0, index + 1).reduce((acc, month) =>
                          acc + (parseFloat(month.net_profit) || 0), base
                        );
                        return cumulative;
                      }),
                      borderColor: '#FFD700',
                      backgroundColor: 'rgba(255, 215, 0, 0.1)',
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: '#FFD700',
                      pointBorderColor: '#000',
                      pointBorderWidth: 2
                    }]
                  }}
                  options={{
                    ...baseChartOptions,
                    scales: {
                      x: {
                        grid: { color: chartTheme.dark.grid },
                        ticks: { color: chartTheme.dark.text }
                      },
                      y: {
                        grid: { color: chartTheme.dark.grid },
                        ticks: {
                          color: chartTheme.dark.text,
                          callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className={styles.performanceMetrics}>
              <h3>Métricas de Desempenho</h3>
              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Sharpe Ratio:</span>
                  <span className={styles.metricValue}>{statisticalAnalysis.sharpeRatio.toFixed(3)}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Volatilidade:</span>
                  <span className={styles.metricValue}>R$ {statisticalAnalysis.volatility.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Expectativa:</span>
                  <span className={styles.metricValue}>R$ {statisticalAnalysis.expectancy.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Maior Ganho:</span>
                  <span className={styles.metricValue} style={{color: '#4CAF50'}}>
                    R$ {statisticalAnalysis.maxGain.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Maior Perda:</span>
                  <span className={styles.metricValue} style={{color: '#F44336'}}>
                    R$ {statisticalAnalysis.maxLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Sequência +:</span>
                  <span className={styles.metricValue}>{statisticalAnalysis.maxWinStreak}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Sequência -:</span>
                  <span className={styles.metricValue}>{statisticalAnalysis.maxLossStreak}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'cashflow':
        if (trendsData.length === 0) return renderEmptyState();

        return (
          <div className={styles.chartCard}>
            <h3>Fluxo de Caixa Mensal</h3>
            <div className={styles.chartContainer}>
              <Bar
                data={{
                  labels: trendsData.map(d => new Date(d.month).toLocaleString('default', { month: 'short' })),
                  datasets: [
                    {
                      label: 'Depósitos',
                      data: trendsData.map(d => d.deposits || 0),
                      backgroundColor: 'rgba(76, 175, 80, 0.8)',
                      borderColor: '#4CAF50',
                      borderWidth: 1
                    },
                    {
                      label: 'Saques',
                      data: trendsData.map(d => d.withdraws || 0),
                      backgroundColor: 'rgba(244, 67, 54, 0.8)',
                      borderColor: '#F44336',
                      borderWidth: 1
                    },
                    {
                      label: 'Lucro Líquido',
                      data: trendsData.map(d => d.net_profit || 0),
                      backgroundColor: 'rgba(255, 215, 0, 0.6)',
                      borderColor: '#FFD700',
                      borderWidth: 2,
                      type: 'line',
                      fill: false,
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  ...baseChartOptions,
                  scales: {
                    x: {
                      grid: { color: chartTheme.dark.grid },
                      stacked: false
                    },
                    y: {
                      grid: { color: chartTheme.dark.grid },
                      ticks: {
                        color: chartTheme.dark.text,
                        callback: function(value) {
                          return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        );

      case 'categories':
        if (categoryAnalysis.length === 0) return renderEmptyState();

        return (
          <div className={styles.categoriesGrid}>
            <div className={styles.chartCard}>
              <h3>Desempenho por Categoria</h3>
              <div className={styles.chartContainer}>
                <Bar
                  data={{
                    labels: categoryAnalysis.map(item => item.category),
                    datasets: [{
                      label: 'Lucro/Prejuízo por Categoria',
                      data: categoryAnalysis.map(item => item.total),
                      backgroundColor: categoryAnalysis.map(item =>
                        item.total >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'
                      ),
                      borderColor: categoryAnalysis.map(item =>
                        item.total >= 0 ? '#4CAF50' : '#F44336'
                      ),
                      borderWidth: 2
                    }]
                  }}
                  options={{
                    ...baseChartOptions,
                    indexAxis: 'y',
                    scales: {
                      x: {
                        grid: { color: chartTheme.dark.grid },
                        ticks: {
                          color: chartTheme.dark.text,
                          callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                          }
                        }
                      },
                      y: {
                        grid: { color: chartTheme.dark.grid },
                        ticks: { color: chartTheme.dark.text }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'risk':
        const operationalTransactions = transactions.filter(tx =>
          apiService.isOperationalTransaction(tx.type)
        );

        if (operationalTransactions.length === 0) return renderEmptyState();

        return (
          <div className={styles.riskGrid}>
            <div className={styles.chartCard}>
              <h3>Distribuição de Resultados</h3>
              <div className={styles.chartContainer}>
                <Scatter
                  data={{
                    datasets: [{
                      label: 'Operações',
                      data: operationalTransactions.map(tx => ({
                        x: tx.amount,
                        y: tx.type === 'gains' ? tx.amount : -tx.amount,
                      })),
                      backgroundColor: operationalTransactions.map(tx =>
                        tx.type === 'gains' ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)'
                      ),
                      borderColor: operationalTransactions.map(tx =>
                        tx.type === 'gains' ? '#4CAF50' : '#F44336'
                      ),
                      borderWidth: 1,
                      pointRadius: 6
                    }]
                  }}
                  options={{
                    ...baseChartOptions,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Valor da Operação (R$)',
                          color: chartTheme.dark.text
                        },
                        grid: { color: chartTheme.dark.grid },
                        ticks: {
                          color: chartTheme.dark.text,
                          callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                          }
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Resultado Líquido (R$)',
                          color: chartTheme.dark.text
                        },
                        grid: { color: chartTheme.dark.grid },
                        ticks: {
                          color: chartTheme.dark.text,
                          callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className={styles.riskMetrics}>
              <h3>Indicadores de Risco</h3>
              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Profit Factor:</span>
                  <span className={styles.metricValue}>
                    {statisticalAnalysis.profitFactor === Infinity ? '∞' : statisticalAnalysis.profitFactor.toFixed(2)}
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Expectativa:</span>
                  <span className={styles.metricValue}>
                    R$ {statisticalAnalysis.expectancy.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Max Drawdown:</span>
                  <span className={styles.metricValue} style={{color: statisticalAnalysis.maxDrawdown > 20 ? '#F44336' : '#FFD700'}}>
                    {statisticalAnalysis.maxDrawdown.toFixed(1)}%
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Volatilidade:</span>
                  <span className={styles.metricValue}>
                    {((statisticalAnalysis.volatility / (parseFloat(overviewData?.current_balance) || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Operações:</span>
                  <span className={styles.metricValue}>{statisticalAnalysis.totalTrades}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Win Rate:</span>
                  <span className={styles.metricValue}>{statisticalAnalysis.winRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            <FaArrowLeft />
            <span>Voltar</span>
          </button>
        </div>
        <div className={styles.selectorRow}>
          {PERIODS.map(period => (
            <button
              key={period.key}
              className={`${styles.selectorButton} ${selectedPeriod === period.key ? styles.selectorButtonActive : ''}`}
              onClick={() => setSelectedPeriod(period.key)}
            >
              {period.label}
            </button>
          ))}
        </div>
        <div className={styles.selectorRow}>
          {CHART_TYPES.map(chart => (
            <button
              key={chart.key}
              className={`${styles.selectorButton} ${selectedChart === chart.key ? styles.selectorButtonActive : ''}`}
              onClick={() => setSelectedChart(chart.key)}
            >
              {chart.icon} {chart.label}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.scrollView}>
        {renderChartContent()}
      </main>
    </div>
  );
};

export default ChartsScreen;