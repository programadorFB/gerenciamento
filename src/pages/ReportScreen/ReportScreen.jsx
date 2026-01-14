import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { useFinancial } from '../../contexts/FinancialContext';
import { useAuth } from '../../contexts/AuthContext';
import FinancialReportPDF from '../../components/FinancialReportPDF';

// --- Icons (Atualizados para tema) ---
import { IoArrowBack, IoDocumentText } from 'react-icons/io5';
import { FaFilePdf, FaFileExcel, FaDownload } from 'react-icons/fa';

// --- CSS Module ---
import styles from './ReportScreen.module.css';

const ReportScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    transactions, 
    balance, 
    initialBankBalance,
    totalDeposits,
    totalWithdraws,
    totalGains,
    totalLosses
  } = useFinancial();

  // Função para exportar para Excel (Lógica mantida)
  const handleExportToExcel = () => {
    const summaryData = [
      ['RESUMO FINANCEIRO - CASSINO ROYAL'],
      [''],
      ['Jogador:', user?.name || 'N/A'],
      ['Email:', user?.email || 'N/A'],
      ['Data de Emissão:', new Date().toLocaleDateString('pt-BR')],
      [''],
      ['Saldo Inicial:', initialBankBalance],
      ['Saldo Atual:', balance],
      ['Lucro Total:', totalGains],
      ['Prejuízo Total:', totalLosses],
      ['Depósitos:', totalDeposits],
      ['Saques:', totalWithdraws],
      [''],
      ['HISTÓRICO DETALHADO'],
      ['Data', 'Tipo', 'Categoria', 'Valor', 'Descrição']
    ];

    const transactionData = transactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'deposit' ? 'Depósito' : 
      t.type === 'withdraw' ? 'Saque' : 
      t.type === 'gains' ? 'Vitória' : 
      t.type === 'losses' ? 'Derrota' : 'Outro',
      t.category,
      t.amount,
      t.description
    ]);

    const finalData = [...summaryData, ...transactionData];
    const ws = XLSX.utils.aoa_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extrato");
    XLSX.writeFile(wb, `Extrato_${user?.name || 'Jogadas'}.xlsx`);
  };

  // Dados para o PDF
  const reportData = {
    user,
    transactions,
    balance,
    initialBankBalance,
    summary: {
      totalDeposits,
      totalWithdraws,
      totalGains,
      totalLosses
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <IoArrowBack size={18} /> VOLTAR
        </button>
        <h1>Extrato Oficial</h1>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.content}>
        
        {/* Painel Lateral de Controle */}
        <section className={styles.controlPanel}>
          <h2 style={{ fontFamily: 'Cinzel, serif', color: '#FFF', margin: '0 0 10px 0', fontSize: '16px' }}>
            <IoDocumentText style={{marginRight: '8px', color: '#D4AF37'}}/>
            Exportação
          </h2>
          <p className={styles.introText}>
            Emita o relatório completo de suas operações na mesa. Disponível em planilha digital ou documento oficial.
          </p>

          <div className={styles.actionsContainer}>
            {/* Excel */}
            <button 
              className={styles.excelButton}
              onClick={handleExportToExcel}
            >
              <FaFileExcel size={20} />
              Baixar Excel
            </button>

            {/* PDF Download */}
            <PDFDownloadLink
              document={<FinancialReportPDF data={reportData} />}
              fileName={`Extrato_Oficial_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              {({ loading }) =>
                loading ? (
                  <span className={styles.loadingText}>Processando documento...</span>
                ) : (
                  <button className={styles.pdfButton}>
                    <FaFilePdf size={20} />
                    Baixar PDF
                  </button>
                )
              }
            </PDFDownloadLink>
          </div>
        </section>

        {/* Área de Visualização */}
        <section className={styles.viewerSection}>
          <h2 className={styles.viewerTitle}>
            Pré-visualização do Documento
          </h2>
          <div className={styles.viewerWrapper}>
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              <FinancialReportPDF data={reportData} />
            </PDFViewer>
          </div>
        </section>

      </main>
    </div>
  );
};

export default ReportScreen;