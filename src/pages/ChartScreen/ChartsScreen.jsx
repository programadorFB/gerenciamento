import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFinancial } from '../../contexts/FinancialContext'; // Adjust path
import apiService from '../../services/api'; // Adjust path

// --- Charting Library Imports ---
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// --- Icons ---
import { FaChartPie, FaChartLine, FaListUl } from 'react-icons/fa';

// --- CSS Module ---
import styles from './ChartsScreen.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend
);

// --- Constants ---
const PERIODS = [ { key: '3', label: '3M' }, { key: '6', label: '6M' }, { key: '12', label: '1A' }];
const CHART_TYPES = [
  { key: 'overview', label: 'Visão Geral', icon: <FaChartPie /> },
  { key: 'trends', label: 'Tendências', icon: <FaChartLine /> },
  { key: 'categories', label: 'Categorias', icon: <FaListUl /> }
];

const ChartsScreen = () => {
  const { transactions } = useFinancial();
  const [selectedPeriod, setSelectedPeriod] = useState('6');
  const [selectedChart, setSelectedChart] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendsRes] = await Promise.all([
        apiService.getAnalyticsOverview(),
        apiService.getMonthlyAnalytics(selectedPeriod)
      ]);
      if (overviewRes.success) setOverviewData(overviewRes.data);
      if (trendsRes.success) setTrendsData(trendsRes.data.sort((a, b) => new Date(a.month) - new Date(b.month)));
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);
  
  // Memoized data for client-side category chart
  const categoryChartData = useMemo(() => {
    const categoryMap = transactions
      .filter(tx => tx.type === 'withdraw')
      .reduce((acc, tx) => {
        const key = tx.category || 'Outros';
        acc[key] = (acc[key] || 0) + tx.amount;
        return acc;
      }, {});

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#FFD700', '#F44336', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
        borderColor: '#1A1A1A',
        borderWidth: 2,
      }],
    };
  }, [transactions]);

  const renderEmptyState = () => (
    <div className={styles.emptyContainer}>
      <FaChartLine size={60} />
      <h2>Nenhum Dado Disponível</h2>
      <p>Adicione transações para ver suas análises.</p>
    </div>
  );

  const renderChartContent = () => {
    if (loading) return <div className={styles.loadingContainer}>Carregando...</div>;
    if (transactions.length === 0) return renderEmptyState();

    const chartOptions = {
      plugins: { legend: { labels: { color: '#CCC' } } },
      scales: { x: { ticks: { color: '#CCC' } }, y: { ticks: { color: '#CCC' } } }
    };

    switch(selectedChart) {
      case 'overview':
        if (!overviewData) return renderEmptyState();
        const pieData = {
          labels: ['Depósitos', 'Saques'],
          datasets: [{
            data: [parseFloat(overviewData.total_deposits), parseFloat(overviewData.total_withdrawals)],
            backgroundColor: ['#4CAF50', '#F44336'],
            borderColor: '#1A1A1A',
            borderWidth: 2,
          }],
        };
        const profitLoss = parseFloat(overviewData.current_balance) - parseFloat(overviewData.initial_balance);
        const roi = overviewData.initial_balance > 0 ? (profitLoss / parseFloat(overviewData.initial_balance)) * 100 : 0;

        return (
          <>
            <div className={styles.chartCard}>
              <h3>Resumo da Banca</h3>
              <Pie data={pieData} options={chartOptions.plugins} />
            </div>
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <p className={styles.statValue}>R$ {parseFloat(overviewData.real_profit).toFixed(2)}</p>
                    <p className={styles.statLabel}>Lucro/Prejuízo Real</p>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statValue} style={{ color: roi >= 0 ? '#4CAF50' : '#F44336' }}>{roi.toFixed(1)}%</p>
                    <p className={styles.statLabel}>ROI</p>
                </div>
            </div>
          </>
        );
      
      case 'trends':
        if (trendsData.length === 0) return renderEmptyState();
        const lineData = {
            labels: trendsData.map(d => new Date(d.month).toLocaleString('default', { month: 'short' })),
            datasets: [
              { label: 'Depósitos', data: trendsData.map(d => d.deposits), borderColor: '#4CAF50', backgroundColor: '#4CAF5050' },
              { label: 'Saques', data: trendsData.map(d => d.withdraws), borderColor: '#F44336', backgroundColor: '#F4433650' }
            ],
        };
        return (
          <div className={styles.chartCard}>
            <h3>Tendências Mensais</h3>
            <Line data={lineData} options={chartOptions} />
          </div>
        );
      
      case 'categories':
        if (categoryChartData.labels.length === 0) return renderEmptyState();
        return (
          <div className={styles.chartCard}>
            <h3>Distribuição de Saques</h3>
            <Pie data={categoryChartData} options={chartOptions.plugins} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
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