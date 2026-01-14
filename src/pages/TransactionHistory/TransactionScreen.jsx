import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFinancial } from '../../contexts/FinancialContext';

// --- Icons (Atualizados para tema Cassino) ---
import { IoArrowBack, IoCalendar, IoCheckmark } from 'react-icons/io5';
import { FaArrowUp, FaArrowDown, FaTrophy, FaChartLine } from 'react-icons/fa';

// --- CSS Module ---
import styles from './TransactionScreen.module.css';

// --- Constants & Utilities ---
const TRANSACTION_TYPES = [
  { 
    name: 'Depósito', 
    key: 'deposit', 
    icon: <FaArrowUp />, 
    color: '#00E0FF', // Azul Neon
    glow: 'rgba(0, 224, 255, 0.4)',
    description: 'Adicionar saldo' 
  },
  { 
    name: 'Saque', 
    key: 'withdraw', 
    icon: <FaArrowDown />, 
    color: '#FFA500', // Laranja
    glow: 'rgba(255, 165, 0, 0.4)',
    description: 'Retirar saldo' 
  },
  { 
    name: 'Vitória', 
    key: 'gains', 
    icon: <FaTrophy />, 
    color: '#00FF88', // Verde Neon
    glow: 'rgba(0, 255, 136, 0.4)',
    description: 'Lucro (Green)' 
  },
  { 
    name: 'Derrota', 
    key: 'losses', 
    icon: <FaChartLine style={{transform: 'scaleY(-1)'}} />, // Gráfico descendo
    color: '#FF4D4D', // Vermelho Neon
    glow: 'rgba(255, 77, 77, 0.4)',
    description: 'Prejuízo (Red)' 
  }
];

const getCurrentDate = () => new Date().toISOString().split('T')[0];

// --- Reusable Sub-Components ---
const DatePicker = ({ visible, onClose, onDateSelect, selectedDate }) => {
  if (!visible) return null;
  return (
    <div className={styles.datePickerOverlay} onClick={onClose}>
      <div className={styles.datePickerContainer} onClick={e => e.stopPropagation()}>
        <h3>DATA DA OPERAÇÃO</h3>
        <input 
          type="date" 
          value={selectedDate || ''} 
          onChange={e => onDateSelect(e.target.value)} 
        />
        <button onClick={onClose}>Confirmar</button>
      </div>
    </div>
  );
};

const DateInput = ({ value, onDateChange }) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const displayDate = value ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' }) : '';
  
  return (
    <div className={styles.dateInputContainer}>
      <input 
        type="text" 
        readOnly 
        value={displayDate} 
        onClick={() => setPickerVisible(true)} 
        placeholder="SELECIONE UMA DATA" 
        className={styles.input} 
      />
      <button type="button" className={styles.calendarIcon} onClick={() => setPickerVisible(true)}>
        <IoCalendar />
      </button>
      <DatePicker 
        visible={pickerVisible} 
        onClose={() => setPickerVisible(false)} 
        onDateSelect={(newDate) => {
          onDateChange(newDate);
          setPickerVisible(false);
        }} 
        selectedDate={value} 
      />
    </div>
  );
};

// --- Main Screen Component ---
const TransactionScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTransaction } = useFinancial();

  const params = new URLSearchParams(location.search);
  const typeParam = params.get('type');
  const dateParam = params.get('defaultDate');

  const [transactionType, setTransactionType] = useState(typeParam || 'deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(dateParam || getCurrentDate());
  const [loading, setLoading] = useState(false);
  const [isInitialBank, setIsInitialBank] = useState(false);
  
  const isValid = useMemo(() => amount && parseFloat(amount.replace(',', '.')) > 0 && date && transactionType, [amount, date, transactionType]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!isValid) return alert('Por favor, preencha todos os campos corretamente.');
    
    setLoading(true);
    const numericAmount = parseFloat(amount.replace(',', '.'));
    const selectedType = TRANSACTION_TYPES.find(type => type.key === transactionType);

    const result = await addTransaction({
      type: transactionType,
      amount: numericAmount,
      description: selectedType.name,
      category: selectedType.name,
      date,
      isInitialBank,
    });
    
    setLoading(false);
    
    if (result?.success) {
      navigate('/dashboard');
    } else {
      alert(result?.error || 'Erro ao adicionar transação');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <IoArrowBack size={18} /> VOLTAR
        </button>
        <h1>TERMINAL</h1>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.content}>
        <form onSubmit={handleAddTransaction} className={styles.formContainer}>
          
          <div className={styles.inputGroup}>
            <label>TIPO DE OPERAÇÃO</label>
            <div className={styles.typeGrid}>
              {TRANSACTION_TYPES.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  className={`${styles.typeButton} ${transactionType === type.key ? styles.typeButtonActive : ''}`}
                  onClick={() => setTransactionType(type.key)}
                  style={{
                    '--type-color': type.color,
                    '--type-color-glow': type.glow
                  }}
                >
                  <div className={styles.typeButtonIcon}>{type.icon}</div>
                  <div className={styles.typeButtonText}>
                    <strong>{type.name}</strong>
                    <span>{type.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="amount">VALOR (R$)</label>
            <input 
              id="amount" 
              type="text" 
              inputMode="decimal" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0,00" 
              className={styles.input} 
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label>DATA</label>
            <DateInput value={date} onDateChange={setDate} />
          </div>
          
          {transactionType === 'deposit' && (
            <div className={styles.checkboxContainer} onClick={() => setIsInitialBank(!isInitialBank)}>
              <div className={`${styles.checkbox} ${isInitialBank ? styles.checkboxActive : ''}`}>
                {isInitialBank && <IoCheckmark />}
              </div>
              <div>
                <label className={styles.checkboxLabel}>BANCA INICIAL</label>
                <p className={styles.checkboxDescription}>Marque se este é o seu depósito inicial.</p>
              </div>
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={!isValid || loading}>
            {loading ? 'PROCESSANDO...' : `CONFIRMAR ${TRANSACTION_TYPES.find(t => t.key === transactionType)?.name.toUpperCase()}`}
          </button>
        </form>
      </main>
    </div>
  );
};

export default TransactionScreen;