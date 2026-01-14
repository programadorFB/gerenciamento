import React, { useState, useEffect, useMemo } from 'react';
import { 
  MdClose, 
  MdEdit, 
  MdDelete, 
  MdInfoOutline, 
  MdTouchApp,
  MdAccessTime 
} from 'react-icons/md';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaTrophy, 
  FaChartLine, 
  FaReceipt 
} from 'react-icons/fa';
import { useFinancial } from '../contexts/FinancialContext';
import styles from './TransactionList.module.css';

// --- MODAL DE EDIÇÃO ---
const EditTransactionModal = ({ visible, transaction, onClose, onSave }) => {
  const [editedTransaction, setEditedTransaction] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (transaction) {
      const dateObject = transaction.date ? new Date(transaction.date) : new Date();
      setEditedTransaction({
        ...transaction,
        dateInput: dateObject.toISOString().split('T')[0],
        timeInput: dateObject.toTimeString().split(' ')[0].substring(0, 5),
      });
      setErrors({});
    }
  }, [transaction]);

  const validateFields = () => {
    const newErrors = {};
    if (!editedTransaction.category?.trim()) newErrors.category = 'Jogo/Categoria é obrigatória';
    if (!editedTransaction.amount || editedTransaction.amount <= 0) newErrors.amount = 'Valor deve ser positivo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateFields()) return;
    
    // Reconstrói a data completa
    const finalDate = new Date(`${editedTransaction.dateInput}T${editedTransaction.timeInput}:00`);
    
    onSave({
      ...editedTransaction,
      date: finalDate.toISOString(),
      amount: parseFloat(editedTransaction.amount)
    });
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <header className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Ajustar Registro</h3>
          <button onClick={onClose} className={styles.closeButton}><MdClose /></button>
        </header>
        
        <div className={styles.modalContent}>
          <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Jogo / Categoria</label>
            <input
              type="text"
              className={`${styles.textInput} ${errors.category ? styles.inputError : ''}`}
              value={editedTransaction.category || ''}
              onChange={(e) => setEditedTransaction({...editedTransaction, category: e.target.value})}
              placeholder="Ex: Roleta, Blackjack"
            />
            {errors.category && <p className={styles.errorText}>{errors.category}</p>}
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Valor (R$)</label>
            <input
              type="number"
              className={`${styles.textInput} ${errors.amount ? styles.inputError : ''}`}
              value={editedTransaction.amount || ''}
              onChange={(e) => setEditedTransaction({...editedTransaction, amount: e.target.value})}
            />
            {errors.amount && <p className={styles.errorText}>{errors.amount}</p>}
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Data e Hora</label>
            <div style={{display: 'flex', gap: '10px'}}>
              <input
                type="date"
                className={styles.dateTimeInput}
                value={editedTransaction.dateInput || ''}
                onChange={(e) => setEditedTransaction({...editedTransaction, dateInput: e.target.value})}
              />
              <input
                type="time"
                className={styles.dateTimeInput}
                value={editedTransaction.timeInput || ''}
                onChange={(e) => setEditedTransaction({...editedTransaction, timeInput: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Observações</label>
            <textarea
              className={styles.textInput}
              rows="3"
              value={editedTransaction.description || ''}
              onChange={(e) => setEditedTransaction({...editedTransaction, description: e.target.value})}
              placeholder="Detalhes da jogada..."
            />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
          <button className={styles.saveButton} onClick={handleSubmit}>Salvar</button>
        </div>
      </div>
    </div>
  );
};

// --- ITEM DA LISTA (TICKET) ---
const TransactionItem = ({ item, showActions = true }) => {
  const { updateTransaction, deleteTransaction } = useFinancial();
  const [isEditing, setIsEditing] = useState(false);

  const amount = parseFloat(item.amount);
  
  // Lógica de Ícones e Cores (Tema Cassino)
  let icon, typeClass, borderColor;
  if (item.type === 'deposit') {
    icon = <FaArrowUp />;
    typeClass = styles.depositColor;
    borderColor = '#00E0FF'; // Azul Neon
  } else if (item.type === 'withdraw') {
    icon = <FaArrowDown />;
    typeClass = styles.withdrawColor;
    borderColor = '#FFA500'; // Laranja
  } else if (item.type === 'gains') {
    icon = <FaTrophy />;
    typeClass = styles.depositColor; // Verde Neon
    borderColor = '#00FF88';
  } else if (item.type === 'losses') {
    icon = <FaChartLine style={{transform: 'scaleY(-1)'}} />;
    typeClass = styles.withdrawColor; // Vermelho Neon
    borderColor = '#FF4D4D';
  } else {
    // Fallback
    icon = <FaReceipt />;
    typeClass = amount >= 0 ? styles.depositColor : styles.withdrawColor;
    borderColor = '#888';
  }

  const handleDelete = () => {
    if (window.confirm('Excluir este registro permanentemente?')) {
      deleteTransaction(item.id);
    }
  };

  const handleUpdate = (updatedData) => {
    updateTransaction(item.id, updatedData);
    setIsEditing(false);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));
  };

  return (
    <>
      <div className={styles.transactionItem} style={{'--item-color': borderColor}}>
        <div className={styles.transactionIcon}>
          {icon}
        </div>
        
        <div className={styles.transactionDetails}>
          <h4 className={styles.transactionCategory}>{item.category}</h4>
          <p className={styles.transactionDate}>
            <MdAccessTime size={10} /> {formatDate(item.date)}
          </p>
          {item.description && <p className={styles.transactionDescription}>{item.description}</p>}
        </div>

        <div className={styles.transactionAmountContainer}>
          <span className={`${styles.transactionAmount} ${typeClass}`}>
            {['deposit', 'gains'].includes(item.type) ? '+' : '-'} {formatCurrency(amount)}
          </span>
          
          {showActions && (
            <div className={styles.actionButtonsContainer}>
              <button 
                onClick={() => setIsEditing(true)} 
                className={styles.editActionButton} 
                title="Editar"
              >
                <MdEdit size={16} />
              </button>
              <button 
                onClick={handleDelete} 
                className={styles.deleteActionButton} 
                title="Excluir"
              >
                <MdDelete size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <EditTransactionModal 
        visible={isEditing} 
        transaction={item} 
        onClose={() => setIsEditing(false)} 
        onSave={handleUpdate} 
      />
    </>
  );
};

// --- COMPONENTE PRINCIPAL ---
const TransactionList = ({ transactions, sortByRecent = true, showActions = true, emptyMessage }) => {
  
  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortByRecent ? dateB - dateA : dateA - dateB;
    });
  }, [transactions, sortByRecent]);

  if (!transactions || transactions.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIconContainer}><FaReceipt /></div>
        <p className={styles.emptyText}>{emptyMessage || 'Mesa Limpa'}</p>
        <p className={styles.emptySubtext}>Nenhuma jogada registrada ainda.</p>
        {showActions && (
          <div className={styles.tipContainer}>
            <MdInfoOutline size={14} />
            <span>Adicione registros no Terminal</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {sortedTransactions.map((transaction) => (
        <TransactionItem 
          key={transaction.id} 
          item={transaction} 
          showActions={showActions} 
        />
      ))}
      
      {showActions && sortedTransactions.length > 5 && (
        <div className={styles.listFooter}>
          <div className={styles.tipContainer}>
            <MdTouchApp size={14} />
            <span>Toque e segure para mais opções</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;