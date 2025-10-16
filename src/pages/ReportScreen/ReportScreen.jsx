import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { useFinancial } from '../../contexts/FinancialContext';
import { useAuth } from '../../contexts/AuthContext';
import FinancialReportPDF from '../../components/FinancialReportPDF';
import { IoArrowBack } from 'react-icons/io5';

// Importando o arquivo de estilos CSS Module
import styles from './ReportScreen.module.css';

const ReportScreen = () => {
  const navigate = useNavigate(); // Hook para navegação
  const { user } = useAuth();
  const { 
    transactions, 
    balance, 
    initialBankBalance,
    totalDeposits,
    totalWithdraws,
    totalGains,
    totalLosses,
    loading
  } = useFinancial();

  if (loading || !user) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Carregando Relatório...</h1>
      </div>
    );
  }

  const reportData = {
    user,
    transactions: [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    summary: {
      initialBalance: initialBankBalance,
      finalBalance: balance,
      totalDeposits,
      totalWithdraws,
      totalGains,
      totalLosses,
    },
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/')} // ALTERAÇÃO: Navega para a rota raiz "/"
        >
          <IoArrowBack size={22} />
        </button>
        <h1 className={styles.title}>Relatório Financeiro</h1>
      </header>
      
      <p className={styles.description}>
        Aqui você pode gerar e visualizar um extrato completo de suas atividades financeiras.
      </p>

      <div className={styles.actionsContainer}>
        <PDFDownloadLink
          document={<FinancialReportPDF data={reportData} />}
          fileName={`Extrato_Financeiro_${user?.name?.replace(' ', '_')}_${new Date().toLocaleDateString('pt-BR')}.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) =>
            loading ? (
              <span className={styles.loadingText}>Gerando PDF...</span>
            ) : (
              <button className={styles.downloadButton}>
                Baixar Relatório
              </button>
            )
          }
        </PDFDownloadLink>
      </div>

      <section className={styles.viewerSection}>
        <h2 className={styles.viewerTitle}>Pré-visualização</h2>
        <div className={styles.viewerWrapper}>
          <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
            <FinancialReportPDF data={reportData} />
          </PDFViewer>
        </div>
      </section>
    </div>
  );
};

export default ReportScreen;