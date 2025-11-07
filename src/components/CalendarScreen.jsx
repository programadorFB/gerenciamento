import React, { useState, useMemo, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../contexts/FinancialContext'; 
import TransactionList from '../components/TransactionList'; 
import { 
    IoArrowBack, 
    IoChevronBack, 
    IoChevronForward, 
    IoClose, 
    IoAdd,
    // ✅ NOVO: Ícones para os botões de ano
    IoPlayBack, 
    IoPlayForward 
} from 'react-icons/io5';
import styles from './CalendarScreen.module.css';

// --- Sub-componente do Grid do Calendário ---
// (Sem alterações aqui... seu código existente)
export const CalendarGrid = ({ currentDate, transactionsByDay, onDayClick }) => {
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatCompact = (num) => num.toLocaleString('pt-BR');

  const days = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysArray = [];
    const firstDayOfWeek = date.getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    // 1. Dias de preenchimento...
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = firstDayOfWeek; i > 0; i--) {
      daysArray.push({
        date: null,
        day: prevMonthDays - i + 1,
        isOtherMonth: true,
      });
    }

    // 2. Dias do mês atual...
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dateKey = fullDate.toISOString().split('T')[0];
      const dailyTransactions = transactionsByDay[dateKey] || [];
      
      let dailyGain = 0;
      let dailyLoss = 0;
      dailyTransactions.forEach(tx => {
          if (tx.type === 'gains') dailyGain += tx.amount;
          if (tx.type === 'losses') dailyLoss += tx.amount;
      });

      daysArray.push({
        date: fullDate,
        day: i,
        isOtherMonth: false,
        isToday: fullDate.getTime() === today.getTime(),
        hasData: dailyTransactions.length > 0,
        transactions: dailyTransactions,
        summary: {
          gain: dailyGain,
          loss: dailyLoss,
        },
      });
    }

    // 3. Dias de preenchimento...
    const remainingCells = 42 - daysArray.length; 
    for (let i = 1; i <= remainingCells; i++) {
      daysArray.push({
        date: null,
        day: i,
        isOtherMonth: true,
      });
    }

    return daysArray;
  }, [currentDate, transactionsByDay, today]);

  return (
    <table className={styles.calendarGrid}>
      <thead>
        <tr>
          {daysOfWeek.map((day) => (
            <th key={day} className={styles.dayHeader}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, weekIndex) => (
          <tr key={weekIndex}>
            {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
              const cellClasses = [
                styles.dayCell,
                day.isOtherMonth ? styles.otherMonth : '',
                day.isToday ? styles.today : '',
                day.hasData ? styles.dayWithData : '',
              ].join(' ');

              return (
                <td
                  key={day.isOtherMonth ? `p-${weekIndex}-${dayIndex}` : day.day}
                  className={cellClasses}
                  onClick={() => !day.isOtherMonth && onDayClick(day.date, day.transactions)}
                  tabIndex={!day.isOtherMonth ? 0 : -1}
                  aria-label={day.isOtherMonth ? '' : `Ver transações de ${day.date.toLocaleDateString()}`}
                >
                  <div className={styles.dayNumber}>{day.day}</div>
                  
                  {day.hasData && (
                    <div className={styles.daySummary}>
                      {day.summary.gain > 0 && (
                        <span className={styles.summaryGain}>
                          +{formatCompact(day.summary.gain)}
                        </span>
                      )}
                      {day.summary.loss > 0 && (
                        <span className={styles.summaryLoss}>
                          -{formatCompact(day.summary.loss)}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// --- Sub-componente do Modal de Transações do Dia ---
// (Sem alterações aqui... seu código existente)
export const DayTransactionsModal = ({ date, transactions, onClose }) => {
  const navigate = useNavigate();
  
  const { dailyNotes, saveDailyNote } = useFinancial();
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const noteDateKey = useMemo(() => {
    return date ? date.toISOString().split('T')[0] : null;
  }, [date]);

  useEffect(() => {
    if (noteDateKey && dailyNotes) {
      const currentNote = dailyNotes[noteDateKey] || '';
      setNoteText(currentNote);
    } else {
      setNoteText('');
    }
  }, [noteDateKey, dailyNotes]);

  if (!date) return null;

  const handleSaveNote = async () => {
    if (!saveDailyNote || !noteDateKey) return;
    
    setIsSaving(true);
    try {
      await saveDailyNote(noteDateKey, noteText);
    } catch (error) {
      console.error("Erro ao salvar anotação:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <IoClose size={24} />
          </button>
        </header>
        
        <div className={styles.notesSection}>
          <h4 className={styles.notesTitle}>Anotações do Dia</h4>
          <textarea
            className={styles.notesTextarea}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Digite suas observações sobre este dia..."
            rows={4}
          />
          <button 
            className={styles.saveNoteButton} 
            onClick={handleSaveNote}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Anotação'}
          </button>
        </div>

        <div className={styles.modalContent}>
          <h4 className={styles.notesTitle}>Transações do Dia</h4>
          <TransactionList
            transactions={transactions}
            showActions={true} 
            emptyMessage="Nenhuma transação neste dia."
          />
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.addTransactionButton}
            onClick={() => navigate(`/transaction?defaultDate=${noteDateKey}`)}
          >
            <IoAdd /> Adicionar Transação
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal da Tela (Página Completa) ---
const CalendarScreen = () => {
  const navigate = useNavigate();
  const { transactions, dailyNotes } = useFinancial();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [modalDate, setModalDate] = useState(null);
  const [modalTransactions, setModalTransactions] = useState([]);

  // Processa as transações...
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

  // --- Funções de Navegação ---
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handlePrevYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  };

  // --- Funções do Modal ---
  const handleDayClick = (date, transactions) => {
    setModalDate(date);
    setModalTransactions(transactions);
  };

  const closeModal = () => {
    setModalDate(null);
    setModalTransactions([]);
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>
      {/* Cabeçalho da Tela (Estilo XP) */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <IoArrowBack /> Voltar
        </button>
        
        <div className={styles.headerControls}>
          {/* ✅ MODIFICADO: Classe e Ícone do Ano */}
          <button 
            className={`${styles.navButton} ${styles.yearButton}`} 
            onClick={handlePrevYear} 
            aria-label="Ano anterior"
          >
            <IoPlayBack />
          </button>
          
          <button className={styles.navButton} onClick={handlePrevMonth} aria-label="Mês anterior">
            <IoChevronBack />
          </button>
          
          <h1 className={styles.monthTitle}>{monthName}</h1>
          
          <button className={styles.navButton} onClick={handleNextMonth} aria-label="Próximo mês">
            <IoChevronForward />
          </button>
          
          {/* ✅ MODIFICADO: Classe e Ícone do Ano */}
          <button 
            className={`${styles.navButton} ${styles.yearButton}`} 
            onClick={handleNextYear} 
            aria-label="Próximo ano"
          >
            <IoPlayForward />
          </button>
        </div>
      </header>

      {/* Corpo com o Calendário */}
      <main className={styles.content}>
        <CalendarGrid
          currentDate={currentDate}
          transactionsByDay={transactionsByDay}
          onDayClick={handleDayClick}
        />
      </main>

      {/* Modal (só é exibido quando modalDate está definido) */}
      <DayTransactionsModal
        date={modalDate}
        transactions={modalTransactions}
        onClose={closeModal}
      />
    </div>
  );
};

export default CalendarScreen;