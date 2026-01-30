import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFinancial } from '../../contexts/FinancialContext';

// --- Icons ---
import { MdArrowBack, MdCalendarToday, MdCheck } from 'react-icons/md';
import { GiToken, GiPayMoney, GiTrophyCup, GiSkullCrossedBones } from 'react-icons/gi';

// --- CSS Module ---
import styles from './TransactionScreen.module.css';

const TRANSACTION_TYPES = [
  { 
    id: 'deposit', 
    label: 'DEPÓSITO', 
    subLabel: 'Depósito',
    icon: GiToken, 
    color: '#00E676', // Verde Neon
    activeClass: styles.typeDeposit 
  },
  { 
    id: 'withdraw', 
    label: 'SAQUE', 
    subLabel: 'Saque',
    icon: GiPayMoney, 
    color: '#FF9100', // Laranja Ouro
    activeClass: styles.typeWithdraw 
  },
  { 
    id: 'gains', 
    label: 'GREEN (WIN)', 
    subLabel: 'Lucro',
    icon: GiTrophyCup, 
    color: '#D4AF37', // Ouro
    activeClass: styles.typeWin 
  },
  { 
    id: 'losses', 
    label: 'RED (LOSS)', 
    subLabel: 'Prejuízo',
    icon: GiSkullCrossedBones, 
    color: '#D50000', // Sangue
    activeClass: styles.typeLoss 
  }
];

const TransactionScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTransaction, loading } = useFinancial();

  // Tenta pegar o tipo da URL (ex: ?type=deposit)
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'gains';

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isInitialBank, setIsInitialBank] = useState(false);

  // Formatação de Moeda
  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = (Number(value) / 100).toFixed(2) + "";
    value = value.replace(".", ",");
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    setAmount(value);
  };

  const getNumericAmount = () => {
    return parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = getNumericAmount();

    if (numericAmount <= 0) {
      alert("O valor deve ser maior que zero.");
      return;
    }

    // Mapear para categorias legíveis
    let category = 'Outros';
    if (type === 'deposit') category = isInitialBank ? 'Banca Inicial' : 'Aporte';
    if (type === 'withdraw') category = 'Retirada';
    if (type === 'gains') category = 'Operação (Win)';
    if (type === 'losses') category = 'Operação (Loss)';

    const payload = {
      type,
      amount: numericAmount,
      date: new Date(date).toISOString(),
      description: description.trim() || category,
      category,
      is_initial_bank: type === 'deposit' && isInitialBank
    };

    const result = await addTransaction(payload);
    if (result.success) {
      navigate(-1);
    } else {
      alert("Erro ao salvar: " + result.error);
    }
  };

  const currentTypeConfig = TRANSACTION_TYPES.find(t => t.id === type);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <MdArrowBack /> <span>CANCELAR</span>
        </button>
        <h1 className={styles.headerTitle}>NOVA OPERAÇÃO</h1>
        <div style={{width: 32}}></div>
      </header>

      <main className={styles.content}>
        
        {/* Seletor de Tipo (Estilo Botões de Máquina) */}
        <div className={styles.typeGrid}>
          {TRANSACTION_TYPES.map((t) => {
            const Icon = t.icon;
            const isActive = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`${styles.typeButton} ${isActive ? t.activeClass : ''}`}
                onClick={() => setType(t.id)}
              >
                <Icon className={styles.typeIcon} />
                <span className={styles.typeLabel}>{t.label}</span>
                {isActive && <div className={styles.activeIndicator} />}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          
          {/* Display de Valor (Estilo Calculadora/Display) */}
          <div className={styles.amountDisplay} style={{ borderColor: currentTypeConfig.color }}>
            <span className={styles.currencySymbol}>R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0,00"
              className={styles.amountInput}
              autoFocus
            />
          </div>

          {/* Campos Adicionais */}
          <div className={styles.fieldsGroup}>
            
            <div className={styles.inputRow}>
              <label>Data</label>
              <div className={styles.dateWrapper}>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.dateInput}
                />
                <MdCalendarToday className={styles.calendarIcon} />
              </div>
            </div>

            <div className={styles.inputRow}>
              <label>Nota</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Alavancagem, Saque parcial..."
                className={styles.textInput}
                maxLength={30}
              />
            </div>

            {/* Checkbox Banca Inicial (Apenas Depósito) */}
            {type === 'deposit' && (
              <div 
                className={`${styles.checkboxRow} ${isInitialBank ? styles.checked : ''}`}
                onClick={() => setIsInitialBank(!isInitialBank)}
              >
                <div className={styles.checkbox}>
                  {isInitialBank && <MdCheck />}
                </div>
                <span>Marcar como Banca Inicial</span>
              </div>
            )}

          </div>

          {/* Botão de Ação (Alavanca) */}
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
            style={{ 
              background: `linear-gradient(135deg, ${currentTypeConfig.color} 0%, #000 150%)`,
              borderColor: currentTypeConfig.color
            }}
          >
            {loading ? 'PROCESSANDO...' : 'CONFIRMAR AÇÃO'}
          </button>

        </form>
      </main>
    </div>
  );
};

export default TransactionScreen;