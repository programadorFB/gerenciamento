import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../../contexts/FinancialContext';

// --- Icons ---
import { IoAddCircle, IoRemoveCircle, IoTrendingUp, IoTrendingDown, IoCheckmark, IoCalendar } from 'react-icons/io5';

// --- CSS Module (reutilize o mesmo) ---
import styles from './TransactionScreen.module.css';

// --- Constantes e Utilitários ---
const TRANSACTION_TYPES = [
  { name: 'Depósito', key: 'deposit', icon: <IoAddCircle />, color: '#4CAF50', description: 'Dinheiro adicionado à banca' },
  { name: 'Saque', key: 'withdraw', icon: <IoRemoveCircle />, color: '#F44336', description: 'Dinheiro retirado da banca' },
  { name: 'Ganhos', key: 'gains', icon: <IoTrendingUp />, color: '#FFD700', description: 'Lucros obtidos em operações' },
  { name: 'Loss', key: 'losses', icon: <IoTrendingDown />, color: '#FFC107', description: 'Prejuízos em operações' }
];
const getCurrentDate = () => new Date().toISOString().split('T')[0];

// --- Sub-componente de Data (pode ser movido para um arquivo separado no futuro) ---
const DatePicker = ({ visible, onClose, onDateSelect, selectedDate }) => {
  if (!visible) return null;
  return (
    <div className={styles.datePickerOverlay} onClick={onClose}>
        <div className={styles.datePickerContainer} onClick={e => e.stopPropagation()}>
            <h3>Selecione a Data</h3>
            <input type="date" defaultValue={selectedDate} onChange={e => onDateSelect(e.target.value)} />
            <button onClick={onClose}>Fechar</button>
        </div>
    </div>
  );
};

const DateInput = ({ value, onDateChange }) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const displayDate = value ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' }) : '';
  
  return (
    <div className={styles.dateInputContainer}>
      <input type="text" readOnly value={displayDate} onClick={() => setPickerVisible(true)} placeholder="Selecione uma data" className={styles.input} />
      <button type="button" className={styles.calendarIcon} onClick={() => setPickerVisible(true)}><IoCalendar /></button>
      <DatePicker visible={pickerVisible} onClose={() => setPickerVisible(false)} onDateSelect={onDateChange} selectedDate={value} />
    </div>
  );
};


// --- Componente do Formulário de Transação ---
const TransactionForm = ({ initialType = 'deposit' }) => {
  const navigate = useNavigate();
  const { addTransaction } = useFinancial();

  const [transactionType, setTransactionType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [loading, setLoading] = useState(false);
  const [isInitialBank, setIsInitialBank] = useState(false);

  const isValid = useMemo(() => amount && parseFloat(amount.replace(',', '.')) > 0 && date && transactionType, [amount, date, transactionType]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!isValid) return alert('Por favor, preencha todos os campos corretamente.');
    
    setLoading(true);
    const numericAmount = parseFloat(amount.replace(',', '.'));
    const selectedType = TRANSACTION_TYPES.find(type => type.key === transactionType);

    await addTransaction({
      type: transactionType,
      amount: numericAmount,
      description: selectedType.name,
      category: selectedType.name,
      date,
      isInitialBank,
    });
    
    setLoading(false);
    alert('Transação adicionada com sucesso!');
    navigate('/dashboard');
  };

  return (
    <form onSubmit={handleAddTransaction} className={styles.formContainer}>
      <div className={styles.inputGroup}>
        <label>Tipo de Transação *</label>
        <div className={styles.typeGrid}>
          {TRANSACTION_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              className={`${styles.typeButton} ${transactionType === type.key ? styles.typeButtonActive : ''}`}
              onClick={() => setTransactionType(type.key)}
              style={{'--type-color': type.color}}
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
        <label htmlFor="amount">Valor *</label>
        <input id="amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" className={styles.input} />
      </div>

      <div className={styles.inputGroup}>
        <label>Data *</label>
        <DateInput value={date} onDateChange={setDate} />
      </div>
      
      {transactionType === 'deposit' && (
        <div className={styles.checkboxContainer} onClick={() => setIsInitialBank(!isInitialBank)}>
          <div className={`${styles.checkbox} ${isInitialBank ? styles.checkboxActive : ''}`}>
            {isInitialBank && <IoCheckmark />}
          </div>
          <div>
            <label className={styles.checkboxLabel}>Banca Inicial</label>
            <p className={styles.checkboxDescription}>Marque se este é um depósito inicial.</p>
          </div>
        </div>
      )}

      <button type="submit" className={styles.submitButton} disabled={!isValid || loading}>
        {loading ? 'Processando...' : `Processar ${TRANSACTION_TYPES.find(t => t.key === transactionType)?.name}`}
      </button>
    </form>
  );
};

export default TransactionForm;