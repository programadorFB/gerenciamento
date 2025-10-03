import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../../contexts/FinancialContext'; // Adjust path
import { MdArrowBack, MdInfoOutline, MdEdit, MdDelete, MdClose, MdEvent, MdAccessTime } from 'react-icons/md';
import { FaPlusCircle, FaMinusCircle, FaReceipt } from 'react-icons/fa';
import styles from './TransactionHistoryScreen.module.css';

// --- Edit Transaction Modal (Web Version) ---
const EditTransactionModal = ({ visible, transaction, onClose, onSave }) => {
    const [editedTransaction, setEditedTransaction] = useState({});
    
    React.useEffect(() => {
        if (transaction) {
            const dateObj = new Date(transaction.date);
            setEditedTransaction({
                ...transaction,
                dateInput: dateObj.toISOString().split('T')[0], // YYYY-MM-DD
                timeInput: dateObj.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
            });
        }
    }, [transaction]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedTransaction(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const finalDate = new Date(`${editedTransaction.dateInput}T${editedTransaction.timeInput}:00`);
        onSave({
            ...editedTransaction,
            date: finalDate.toISOString(),
            amount: parseFloat(String(editedTransaction.amount).replace(',', '.')),
        });
        onClose();
    };

    if (!visible) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <header className={styles.modalHeader}>
                    <h3>Editar Transação</h3>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </header>
                <main className={styles.modalContent}>
                    <div className={styles.inputGroup}>
                        <label>Categoria</label>
                        <input type="text" name="category" value={editedTransaction.category || ''} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Valor (R$)</label>
                        <input type="text" inputMode="decimal" name="amount" value={editedTransaction.amount || ''} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Data e Hora</label>
                        <div className={styles.dateTimeContainer}>
                            <input type="date" name="dateInput" value={editedTransaction.dateInput || ''} onChange={handleChange} />
                            <input type="time" name="timeInput" value={editedTransaction.timeInput || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Descrição</label>
                        <textarea name="description" value={editedTransaction.description || ''} onChange={handleChange} rows="3"></textarea>
                    </div>
                </main>
                <footer className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button className={styles.saveButton} onClick={handleSave}>Salvar</button>
                </footer>
            </div>
        </div>
    );
};

// --- Transaction Item (Web Version) ---
const TransactionItem = React.memo(({ item, onEdit, onDelete }) => {
    const isDeposit = item.type === 'deposit';
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    return (
        <div className={styles.itemContainer}>
            <div className={styles.itemTouchable}>
                <div className={styles.iconContainer} style={{ backgroundColor: isDeposit ? '#4CAF5020' : '#F4433620' }}>
                    {isDeposit ? <FaPlusCircle color="#4CAF50" size={20} /> : <FaMinusCircle color="#F44336" size={20} />}
                </div>
                <div className={styles.detailsContainer}>
                    <p className={styles.itemCategory}>{item.category || 'Não categorizado'}</p>
                    <p className={styles.itemDate}>{formatDate(item.date)}</p>
                    {item.description && <p className={styles.itemDescription}>{item.description}</p>}
                </div>
                <p className={styles.itemAmount} style={{ color: isDeposit ? '#4CAF50' : '#F44336' }}>
                    {isDeposit ? '+' : '-'} {formatCurrency(item.amount)}
                </p>
            </div>
            <div className={styles.permanentActions}>
                <button onClick={() => onEdit(item)} className={styles.editButton}><MdEdit size={18} /></button>
                <button onClick={() => onDelete(item.id)} className={styles.deleteButton}><MdDelete size={18} /></button>
            </div>
        </div>
    );
});


// --- Main Screen Component (Web Version) ---
const TransactionHistoryScreen = () => {
    const navigate = useNavigate();
    const { transactions, loading, refreshData, updateTransaction, deleteTransaction } = useFinancial();
    const [filter, setFilter] = useState('all');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const onRefresh = useCallback(() => { refreshData(true); }, [refreshData]);

    const handleEditTransaction = (transaction) => {
        setSelectedTransaction(transaction);
        setEditModalVisible(true);
    };
    
    const handleSaveTransaction = async (editedTransaction) => {
        await updateTransaction(editedTransaction.id, editedTransaction);
        onRefresh(); // Refresh data after update
    };

    const handleDeleteTransaction = (transactionId) => {
        if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
            deleteTransaction(transactionId).then(() => onRefresh());
        }
    };

    const filteredTransactions = useMemo(() => {
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filter === 'all') return sorted;
        return sorted.filter(tx => tx.type === filter);
    }, [transactions, filter]);
    
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backButton}><MdArrowBack size={24} /></button>
                <h1>Histórico de Transações</h1>
                <button className={styles.infoButton} onClick={() => alert('Para editar ou excluir uma transação, use os botões à direita de cada item.')}>
                    <MdInfoOutline size={20} />
                </button>
            </header>

            <div className={styles.filterContainer}>
                <button onClick={() => setFilter('all')} className={filter === 'all' ? styles.filterActive : ''}>Todas</button>
                <button onClick={() => setFilter('deposit')} className={filter === 'deposit' ? styles.filterActive : ''}>Depósitos</button>
                <button onClick={() => setFilter('withdraw')} className={filter === 'withdraw' ? styles.filterActive : ''}>Saques</button>
            </div>

            <main className={styles.listContainer}>
                {loading && transactions.length === 0 ? (
                    <div className={styles.loadingContainer}>Carregando...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div className={styles.emptyContainer}>
                        <FaReceipt size={50} />
                        <p>Nenhuma Transação Encontrada</p>
                    </div>
                ) : (
                    filteredTransactions.map(item => (
                        <TransactionItem key={item.id} item={item} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                    ))
                )}
            </main>
            
            <EditTransactionModal
                visible={editModalVisible}
                transaction={selectedTransaction}
                onClose={() => setEditModalVisible(false)}
                onSave={handleSaveTransaction}
            />
        </div>
    );
};

export default TransactionHistoryScreen;