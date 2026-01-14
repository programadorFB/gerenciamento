import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../../contexts/FinancialContext';
import { MdArrowBack, MdInfoOutline, MdEdit, MdDelete, MdClose } from 'react-icons/md';
import { FaPlusCircle, FaMinusCircle, FaReceipt, FaCoins, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import styles from './TransactionHistoryScreen.module.css';

// Cores do Tema (Neon & Ouro)
const THEME_COLORS = {
    gold: '#D4AF37',
    neonGreen: '#00FF88',
    neonRed: '#FF4D4D',
    neonBlue: '#00E0FF',
};

// --- Edit Transaction Modal ---
const EditTransactionModal = ({ visible, transaction, onClose, onSave }) => {
    const [editedTransaction, setEditedTransaction] = useState({});
    
    React.useEffect(() => {
        if (transaction) {
            const dateObj = new Date(transaction.date);
            setEditedTransaction({
                ...transaction,
                dateInput: dateObj.toISOString().split('T')[0],
                timeInput: dateObj.toTimeString().split(' ')[0].substring(0, 5),
            });
        }
    }, [transaction]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedTransaction(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const finalDate = new Date(`${editedTransaction.dateInput}T${editedTransaction.timeInput}:00`);
        const normalizedTransaction = {
            ...editedTransaction,
            date: finalDate.toISOString(),
            amount: parseFloat(String(editedTransaction.amount).replace(',', '.')),
        };
        onSave(normalizedTransaction);
        onClose();
    };

    if (!visible) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <header className={styles.modalHeader}>
                    <h3>Ajustar Registro</h3>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </header>
                <main className={styles.modalContent}>
                    <div className={styles.inputGroup}>
                        <label>Tipo de Movimento</label>
                        <select name="type" value={editedTransaction.type || ''} onChange={handleChange}>
                            <option value="deposit">Depósito (Entrada)</option>
                            <option value="withdraw">Saque (Saída)</option>
                            <option value="gains">Vitória (Green)</option>
                            <option value="losses">Derrota (Red)</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Categoria / Jogo</label>
                        <input type="text" name="category" value={editedTransaction.category || ''} onChange={handleChange} placeholder="Ex: Roleta, Blackjack..." />
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
                        <label>Observações</label>
                        <textarea name="description" value={editedTransaction.description || ''} onChange={handleChange} rows="3" placeholder="Detalhes da jogada..."></textarea>
                    </div>
                </main>
                <footer className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button className={styles.saveButton} onClick={handleSave}>Confirmar</button>
                </footer>
            </div>
        </div>
    );
};

// --- Transaction Item (Ticket) ---
const TransactionItem = React.memo(({ item, onEdit, onDelete }) => {
    
    // Configurações Visuais baseadas no Tipo
    const getTransactionInfo = (transaction) => {
        const amount = parseFloat(transaction.amount) || 0;
        
        // Cores e Ícones Neon
        switch (transaction.type) {
            case 'deposit':
                return {
                    icon: <FaArrowUp color={THEME_COLORS.neonBlue} size={16} />,
                    color: THEME_COLORS.neonBlue,
                    label: 'Depósito',
                    borderColor: THEME_COLORS.neonBlue
                };
            case 'withdraw':
                return {
                    icon: <FaArrowDown color="#FFA500" size={16} />,
                    color: "#FFA500", // Laranja
                    label: 'Saque',
                    borderColor: "#FFA500"
                };
            case 'gains':
                return {
                    icon: <FaCoins color={THEME_COLORS.neonGreen} size={16} />,
                    color: THEME_COLORS.neonGreen,
                    label: 'Green',
                    borderColor: THEME_COLORS.neonGreen
                };
            case 'losses':
                return {
                    icon: <FaCoins color={THEME_COLORS.neonRed} size={16} />,
                    color: THEME_COLORS.neonRed,
                    label: 'Red',
                    borderColor: THEME_COLORS.neonRed
                };
            default:
                const isPositive = amount >= 0;
                return {
                    icon: <FaReceipt color="#888" size={16} />,
                    color: isPositive ? THEME_COLORS.neonGreen : "#888",
                    label: 'Outro',
                    borderColor: "#444"
                };
        }
    };

    const info = getTransactionInfo(item);
    const amountValue = Math.abs(parseFloat(item.amount) || 0);
    
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(value);
    
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString('pt-BR', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
    });

    return (
        <div 
            className={styles.itemContainer}
            style={{ '--tx-color': info.borderColor }} // Variável CSS para a borda lateral
        >
            <div className={styles.itemTouchable}>
                <div className={styles.iconContainer}>
                    {info.icon}
                </div>
                
                <div className={styles.detailsContainer}>
                    <div className={styles.categoryRow}>
                        <span className={styles.itemCategory}>{item.category || 'Geral'}</span>
                        <span className={styles.typeBadge}>{info.label}</span>
                    </div>
                    <p className={styles.itemDate}>{formatDate(item.date)}</p>
                    {item.description && (
                        <p className={styles.itemDescription}>{item.description}</p>
                    )}
                </div>

                <p className={`${styles.itemAmount} ${
                    ['deposit', 'gains'].includes(item.type) || (!item.type && parseFloat(item.amount) >= 0) 
                    ? styles.amountPositive 
                    : styles.amountNegative
                }`}>
                    {['deposit', 'gains'].includes(item.type) ? '+' : '-'} {formatCurrency(amountValue)}
                </p>
            </div>

            <div className={styles.permanentActions}>
                <button onClick={() => onEdit(item)} className={styles.editButton} title="Editar">
                    <MdEdit size={18} />
                </button>
                <button onClick={() => onDelete(item.id)} className={styles.deleteButton} title="Excluir">
                    <MdDelete size={18} />
                </button>
            </div>
        </div>
    );
});

// --- Main Screen ---
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
        onRefresh();
    };

    const handleDeleteTransaction = (transactionId) => {
        if (window.confirm('Confirma a exclusão deste registro?')) {
            deleteTransaction(transactionId).then(() => onRefresh());
        }
    };

    const filteredTransactions = useMemo(() => {
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filter === 'all') return sorted;
        if (filter === 'incomes') return sorted.filter(tx => tx.type === 'deposit' || tx.type === 'gains');
        if (filter === 'outcomes') return sorted.filter(tx => tx.type === 'withdraw' || tx.type === 'losses');
        return sorted.filter(tx => tx.type === filter);
    }, [transactions, filter]);
    
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <MdArrowBack size={20} />
                </button>
                <h1>Registro de Apostas</h1>
                <button className={styles.infoButton} onClick={() => alert('Este é o seu registro oficial de entradas e saídas.')}>
                    <MdInfoOutline size={20} />
                </button>
            </header>

            {/* Chips de Filtro */}
            <div className={styles.filterContainer}>
                <button onClick={() => setFilter('all')} className={filter === 'all' ? styles.filterActive : ''}>
                    Todos
                </button>
                <button onClick={() => setFilter('gains')} className={filter === 'gains' ? styles.filterActive : ''}>
                    Vitórias
                </button>
                <button onClick={() => setFilter('losses')} className={filter === 'losses' ? styles.filterActive : ''}>
                    Derrotas
                </button>
                <button onClick={() => setFilter('incomes')} className={filter === 'incomes' ? styles.filterActive : ''}>
                    Depósitos
                </button>
                <button onClick={() => setFilter('outcomes')} className={filter === 'outcomes' ? styles.filterActive : ''}>
                    Saques
                </button>
            </div>

            <main className={styles.listContainer}>
                {loading && transactions.length === 0 ? (
                    <div className={styles.loadingContainer}>Carregando Registros...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div className={styles.emptyContainer}>
                        <FaReceipt size={40} />
                        <p>Nenhum registro encontrado</p>
                    </div>
                ) : (
                    filteredTransactions.map(item => (
                        <TransactionItem 
                            key={item.id} 
                            item={item} 
                            onEdit={handleEditTransaction} 
                            onDelete={handleDeleteTransaction} 
                        />
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