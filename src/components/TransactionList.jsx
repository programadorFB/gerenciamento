import React, { useState, useEffect, useMemo } from 'react';
import { MdClose, MdEdit, MdDelete, MdAccessTime } from 'react-icons/md';
import { FaArrowUp, FaArrowDown, FaTrophy, FaChartLine, FaReceipt } from 'react-icons/fa';
import { useFinancial } from '../contexts/FinancialContext';
import styles from './TransactionList.module.css';

// --- MODAL DE EDIÇÃO ---
const EditTransactionModal = ({ visible, transaction, onClose, onSave }) => {
  const [editedTransaction, setEditedTransaction] = useState({});
  
  useEffect(() => {
    if (transaction) {
      const dateObject = transaction.date ? new Date(transaction.date) : new Date();
      setEditedTransaction({
        ...transaction,
        dateInput: dateObject.toISOString().split('T')[0],
        timeInput: dateObject.toTimeString().split(' ')[0].substring(0, 5),
      });
    }
  }, [transaction]);

  const handleSubmit = () => {
    if (!editedTransaction.category || !editedTransaction.amount) return;
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
          <h3 className={styles.modalTitle}>Detalhes do Registro</h3>
          <button onClick={onClose} className={styles.closeButton}><MdClose /></button>
        </header>
        
        <div className={styles.modalContent}>
          <div>
            <label className={styles.inputLabel}>Categoria</label>
            <input
              type="text"
              className={styles.textInput}
              value={editedTransaction.category || ''}
              onChange={(e) => setEditedTransaction({...editedTransaction, category: e.target.value})}
            />
          </div>
          <div>
            <label className={styles.inputLabel}>Valor (R$)</label>
            <input
              type="number"
              className={styles.textInput}
              value={editedTransaction.amount || ''}
              onChange={(e) => setEditedTransaction({...editedTransaction, amount: e.target.value})}
            />
          </div>
          <div>
            <label className={styles.inputLabel}>Data</label>
            <div style={{display: 'flex', gap: '10px'}}>
              <input
                type="date"
                className={styles.textInput}
                value={editedTransaction.dateInput || ''}
                onChange={(e) => setEditedTransaction({...editedTransaction, dateInput: e.target.value})}
              />
              <input
                type="time"
                className={styles.textInput}
                value={editedTransaction.timeInput || ''}
                onChange={(e) => setEditedTransaction({...editedTransaction, timeInput: e.target.value})}
              />
            </div>
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

// --- ITEM DA LISTA ---
const TransactionItem = ({ item, showActions = true }) => {
  const { updateTransaction, deleteTransaction } = useFinancial();
  const [isEditing, setIsEditing] = useState(false);
  const amount = parseFloat(item.amount);
  
  // Cores de Identidade
  let icon, typeClass, borderColor;
  if (item.type === 'deposit') {
    icon = <FaArrowUp />;
    typeClass = styles.depositColor;
    borderColor = '#2E7D32'; 
  } else if (item.type === 'withdraw') {
    icon = <FaArrowDown />;
    typeClass = styles.withdrawColor;
    borderColor = '#C62828';
  } else if (item.type === 'gains') {
    icon = <FaTrophy />;
    typeClass = styles.depositColor; 
    borderColor = '#D4AF37';
  } else if (item.type === 'losses') {
    icon = <FaChartLine style={{transform: 'scaleY(-1)'}} />;
    typeClass = styles.withdrawColor;
    borderColor = '#8B0000';
  } else {
    icon = <FaReceipt />;
    typeClass = amount >= 0 ? styles.depositColor : styles.withdrawColor;
    borderColor = '#555';
  }

  const handleDelete = () => {
    if (window.confirm('Remover registro?')) deleteTransaction(item.id);
  };

  const handleUpdate = (updatedData) => {
    updateTransaction(item.id, updatedData);
    setIsEditing(false);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} • ${d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));

  return (
    <>
      <div className={styles.transactionItem} style={{'--item-color': borderColor}}>
        <div className={styles.transactionIcon}>{icon}</div>
        
        <div className={styles.transactionDetails}>
          <span className={styles.transactionCategory}>{item.category}</span>
          <span className={styles.transactionDate}>{formatDate(item.date)}</span>
          {item.description && <span className={styles.transactionDescription}>{item.description}</span>}
        </div>

        <div className={styles.transactionAmountContainer}>
          <span className={`${styles.transactionAmount} ${typeClass}`}>
            {['deposit', 'gains'].includes(item.type) ? '+' : '-'} {formatCurrency(amount)}
          </span>
        </div>

        {showActions && (
          <div className={styles.actionButtonsContainer}>
            <button onClick={() => setIsEditing(true)} className={styles.actionBtn}><MdEdit size={14}/></button>
            <button onClick={handleDelete} className={styles.actionBtn}><MdDelete size={14}/></button>
          </div>
        )}
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
      <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '1px dashed #333', borderRadius: '8px' }}>
        <p style={{ fontSize: '13px', fontStyle: 'italic' }}>{emptyMessage || 'Livro Caixa Vazio'}</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {sortedTransactions.map((transaction) => (
        <TransactionItem key={transaction.id} item={transaction} showActions={showActions} />
      ))}
    </div>
  );
};

export default TransactionList;