import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { useFinancial } from '../../contexts/FinancialContext';
import { useAuth } from '../../contexts/AuthContext';
import FinancialReportPDF from '../../components/FinancialReportPDF';

// --- Icons (Substituídos por fontes mais estáveis) ---
import { MdArrowBack, MdSecurity, MdFileDownload, MdPictureAsPdf } from 'react-icons/md';
import { FaFileExcel, FaStamp, FaFilePdf } from 'react-icons/fa';

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

  const handleExportToExcel = () => {
    const summaryData = [
      ['RELATÓRIO OFICIAL - ROYAL CLUB'],
      [''],
      ['Jogador:', user?.name || 'Anônimo'],
      ['Emissão:', new Date().toLocaleString('pt-BR')],
      [''],
      ['RESUMO DE BANCA'],
      ['Saldo Atual:', balance],
      ['Lucro Real:', totalGains - totalLosses],
      [''],
      ['DETALHAMENTO'],
      ['Data', 'Tipo', 'Categoria', 'Valor']
    ];

    const transactionData = transactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type,
      t.category,
      t.amount
    ]);

    const finalData = [...summaryData, ...transactionData];
    const ws = XLSX.utils.aoa_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extrato");
    XLSX.writeFile(wb, `Extrato_RoyalClub.xlsx`);
  };

  const reportData = {
    user,
    transactions,
    balance,
    initialBankBalance,
    summary: { totalDeposits, totalWithdraws, totalGains, totalLosses }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <MdArrowBack size={18} /> <span>MESA</span>
        </button>
        <div className={styles.headerTitleContainer}>
            <MdSecurity className={styles.securityIcon} />
            <h1>AUDITORIA DA BANCA</h1>
        </div>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.content}>
        <section className={styles.controlPanel}>
          <div className={styles.panelHeader}>
            <h2><FaStamp /> EXPORTAR EXTRATO</h2>
            <p>Selecione o formato para emissão dos registros oficiais da mesa.</p>
          </div>

          <div className={styles.actionsContainer}>
            {/* Excel Card - Usando FaFileExcel */}
            <button className={`${styles.exportCard} ${styles.excelCard}`} onClick={handleExportToExcel}>
              <div className={styles.iconBoxExcel}>
                <FaFileExcel size={24} />
              </div>
              <div className={styles.cardText}>
                <span className={styles.cardTitle}>Planilha Analítica</span>
                <span className={styles.cardSub}>Formato .XLSX</span>
              </div>
              <MdFileDownload className={styles.downloadIcon} />
            </button>

            {/* PDF Card - Usando FaFilePdf */}
            <PDFDownloadLink
              document={<FinancialReportPDF data={reportData} />}
              fileName="Extrato_Oficial.pdf"
              className={styles.pdfLinkWrapper}
            >
              {({ loading }) => (
                <button className={`${styles.exportCard} ${styles.pdfCard}`} disabled={loading}>
                  <div className={styles.iconBoxPdf}>
                    <FaFilePdf size={24} />
                  </div>
                  <div className={styles.cardText}>
                    <span className={styles.cardTitle}>Documento PDF</span>
                    <span className={styles.cardSub}>{loading ? 'Gerando...' : 'Formato .PDF'}</span>
                  </div>
                  <MdFileDownload className={styles.downloadIcon} />
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </section>

        <section className={styles.viewerSection}>
          <div className={styles.viewerHeader}>
            <span className={styles.liveIndicator}></span>
            <h2>PRÉ-VISUALIZAÇÃO</h2>
          </div>
          <div className={styles.viewerFrame}>
            <PDFViewer width="100%" height="100%" className={styles.pdfFrame}>
              <FinancialReportPDF data={reportData} />
            </PDFViewer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReportScreen;