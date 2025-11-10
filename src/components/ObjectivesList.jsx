
import React, { useState, useEffect } from 'react';
import { MdClose, MdEdit, MdDelete, MdInfoOutline, MdEvent, MdCheckCircle } from 'react-icons/md';
import { FaBullseye, FaTrophy } from 'react-icons/fa';
import styles from './ObjectiveList.module.css';
import { useFinancial } from '../contexts/FinancialContext';

// Importar o serviço de API
import apiService from '../services/api';

// --- COMPONENTE DO MODAL DE EDIÇÃO ---
const EditObjectiveModal = ({ visible, objective, onClose, onSave }) => {
  const [editedObjective, setEditedObjective] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (objective) {
      setEditedObjective({
        ...objective,
        target_date: objective.target_date ? new Date(objective.target_date).toISOString().split('T')[0] : ''
      });
      setErrors({});
    }
  }, [objective]);

  const validateFields = () => {
    const newErrors = {};
    if (!editedObjective.title?.trim()) newErrors.title = 'Título é obrigatório';
    if (!editedObjective.target_amount || editedObjective.target_amount <= 0) newErrors.target_amount = 'Meta deve ser maior que zero';
    if (!editedObjective.target_date) {
      newErrors.target_date = 'Data limite é obrigatória';
    } else {
      const selectedDate = new Date(editedObjective.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.target_date = 'Data limite não pode ser no passado';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      alert('Erro: Por favor, corrija os campos antes de salvar.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...editedObjective,
        title: editedObjective.title.trim(),
        target_amount: parseFloat(editedObjective.target_amount),
      });
      onClose();
    } catch (error) {
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    setEditedObjective(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedObjective(prev => ({ ...prev, [name]: value }));
  };

  const calculateProgress = () => {
    const current = parseFloat(editedObjective.current_amount) || 0;
    const target = parseFloat(editedObjective.target_amount) || 1;
    return Math.min((current / target) * 100, 100);
  };
  
  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar Objetivo</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <MdClose size={24} />
          </button>
        </header>
        <div className={styles.modalContent}>
          <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Título do Objetivo *</label>
            <input name="title" type="text" className={`${styles.textInput} ${errors.title ? styles.inputError : ''}`} value={editedObjective.title || ''} onChange={handleChange} placeholder="Ex: Comprar um carro" />
            {errors.title && <p className={styles.errorText}>{errors.title}</p>}
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Meta (R$) *</label>
            <input name="target_amount" type="text" inputMode="decimal" className={`${styles.textInput} ${errors.target_amount ? styles.inputError : ''}`} value={editedObjective.target_amount || ''} onChange={handleAmountChange} placeholder="10000,00" />
            {errors.target_amount && <p className={styles.errorText}>{errors.target_amount}</p>}
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Data Limite *</label>
            <input name="target_date" type="date" className={`${styles.textInput} ${errors.target_date ? styles.inputError : ''}`} value={editedObjective.target_date || ''} onChange={handleChange} />
            {errors.target_date && <p className={styles.errorText}>{errors.target_date}</p>}
          </div>
          <div className={styles.previewContainer}>
            <p className={styles.previewLabel}>Prévia do Objetivo:</p>
            <div className={styles.previewCard}>
              <p className={styles.previewTitle}>{editedObjective.title || 'Título do Objetivo'}</p>
              <div className={styles.progressBarBackground}>
                <div className={styles.progressBarFill} style={{ width: `${calculateProgress()}%` }}></div>
              </div>
              <p className={styles.previewPercentage}>{calculateProgress().toFixed(1)}% Concluído</p>
            </div>
          </div>
        </div>
        <footer className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
          <button className={styles.saveButton} onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </footer>
      </div>
    </div>
  );
};

// --- COMPONENTE DO ITEM INDIVIDUAL ---
const ObjectiveItem = ({ item, currentBalance, onUpdateObjective, onDeleteObjective, onCompleteObjective }) => {
  const [showActions, setShowActions] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const getDaysRemaining = (deadline) => Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));

  // ✅ MUDANÇA: Progresso baseado no saldo atual
  const progress = Math.min((currentBalance / item.target_amount) * 100, 100);
  const isCompleted = progress >= 100 || item.status === 'completed';
  const daysRemaining = getDaysRemaining(item.target_date);
  
  const handleEdit = (e) => {
    e.stopPropagation();
    setShowActions(false);
    setEditModalVisible(true);
  };
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowActions(false);
    if (window.confirm(`Tem certeza que deseja excluir o objetivo "${item.title}"?`)) {
      setIsDeleting(true);
      setTimeout(() => onDeleteObjective(item.id), 300); 
    }
  };

  // ✅ MUDANÇA: Handler para checkbox de conclusão
  const handleCheckboxChange = async (e) => {
    e.stopPropagation();
    if (item.status !== 'completed') {
      if (window.confirm(`Marcar objetivo "${item.title}" como concluído?`)) {
        await onCompleteObjective(item.id);
      }
    }
  };
  
  const handleSaveObjective = async (editedObjective) => {
    await onUpdateObjective(editedObjective.id, editedObjective);
  };

  const getProgressGradientId = (p) => {
    if (p >= 80) return 'gradientGreen';
    if (p >= 50) return 'gradientGold';
    if (p >= 25) return 'gradientOrange';
    return 'gradientRed';
  };

  const RADIUS = 35;
  const STROKE_WIDTH = 8;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progressStroke = (CIRCUMFERENCE * progress) / 100;

  return (
    <>
      <div className={`${styles.objectiveItem} ${isDeleting ? styles.isDeleting : ''} ${item.status === 'completed' ? styles.completedItem : ''}`} onClick={() => setShowActions(!showActions)}>
        <div className={styles.objectiveHeader}>
          <h3 className={styles.objectiveTitle}>{item.title}</h3>
          <div className={styles.headerRight}>
            <span className={styles.objectiveProgress}>{progress.toFixed(1)}%</span>
            
            {/* ✅ MUDANÇA: Checkbox para marcar como concluído */}
            {isCompleted && item.status !== 'completed' && (
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={handleCheckboxChange}
                  className={styles.checkboxInput}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={styles.checkboxCheckmark}></span>
              </label>
            )}
            
            {item.status === 'completed' && (
              <div className={styles.completedBadge}>
                <MdCheckCircle size={20} color="#4CAF50" />
              </div>
            )}
          </div>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.donutContainer}>
            <svg height="90" width="90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#66BB6A"/>
                  <stop offset="100%" stopColor="#4CAF50"/>
                </linearGradient>
                <linearGradient id="gradientGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFEB3B"/>
                  <stop offset="100%" stopColor="#2f00ffff"/>
                </linearGradient>
                <linearGradient id="gradientOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFA726"/>
                  <stop offset="100%" stopColor="#FF9800"/>
                </linearGradient>
                <linearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF5350"/>
                  <stop offset="100%" stopColor="#F44336"/>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r={RADIUS} stroke="rgba(51, 51, 51, 0.8)" strokeWidth={STROKE_WIDTH} fill="none" />
              <circle cx="50" cy="50" r={RADIUS} stroke={`url(#${getProgressGradientId(progress)})`} strokeWidth={STROKE_WIDTH} strokeDasharray={`${progressStroke}, ${CIRCUMFERENCE}`} strokeLinecap="round" transform="rotate(-90 50 50)" fill="none" />
            </svg>
            <div className={styles.donutTextOverlay}>
              <span className={styles.donutTextPercent}>{`${Math.round(progress)}%`}</span>
              <span className={styles.donutTextLabel}>Completo</span>
            </div>
          </div>
          <div className={styles.objectiveDetails}>
            {/* ✅ MUDANÇA: Mostrar saldo atual ao invés de current_amount */}
            <p className={styles.currentAmount}>{formatCurrency(currentBalance)}</p>
            <p className={styles.targetAmount}>de {formatCurrency(item.target_amount)}</p>
            <div className={styles.deadlineDateContainer}>
              <MdEvent size={14} />
              <span>Meta: {formatDate(item.target_date)}</span>
            </div>
            <p className={styles.deadline}>
              {daysRemaining > 0 ? `${daysRemaining} dias restantes` : daysRemaining === 0 ? 'Vence hoje' : `${Math.abs(daysRemaining)} dias em atraso`}
            </p>
          </div>
        </div>

        {/* ✅ MUDANÇA: Removido o botão de concluir da área de ações */}
        <div className={`${styles.actionButtonsContainer} ${showActions ? styles.actionsVisible : ''}`}>
          <button onClick={handleEdit}>
            <MdEdit /> Editar
          </button>
          <button onClick={handleDelete} className={styles.deleteButton}>
            <MdDelete /> Excluir
          </button>
        </div>
      </div>
      <EditObjectiveModal visible={editModalVisible} objective={item} onClose={() => setEditModalVisible(false)} onSave={handleSaveObjective} />
    </>
  );
};

// --- COMPONENTE PRINCIPAL DA LISTA ---
const ObjectivesList = ({ showCompleted = false }) => {
  const { objectives, balance, updateObjective, deleteObjective, refreshData } = useFinancial();
  const [localObjectives, setLocalObjectives] = useState([]);

  useEffect(() => {
    // ✅ MUDANÇA: Filtrar por status (completed ou in_progress)
    const filtered = objectives.filter(obj => 
      showCompleted ? obj.status === 'completed' : obj.status !== 'completed'
    );
    setLocalObjectives(filtered);
  }, [objectives, showCompleted]);
  
  const handleObjectiveDeleted = async (deletedId) => {
    setLocalObjectives(current => current.filter(obj => obj.id !== deletedId));
    
    try {
      await apiService.deleteObjective(deletedId);
      await refreshData();
    } catch (error) {
      alert(`Erro ao excluir objetivo: ${error.message}`);
      setLocalObjectives(objectives);
    }
  };
  
  const handleObjectiveUpdated = async (id, updatedData) => {
    setLocalObjectives(currentObjs =>
      currentObjs.map(obj => (obj.id === id ? { ...obj, ...updatedData } : obj))
    );

    try {
      await apiService.updateObjective(id, updatedData);
      await refreshData();
    } catch(error) {
      alert(`Erro ao atualizar objetivo: ${error.message}`);
      setLocalObjectives(objectives);
    }
  };

  // ✅ NOVO: Função para marcar objetivo como concluído
  const handleObjectiveCompleted = async (objectiveId) => {
    try {
      // Buscar o objetivo para pegar o target_amount
      const objective = localObjectives.find(obj => obj.id === objectiveId);
      
      // Atualizar com current_amount igual ao target_amount (isso fará o backend marcar como completed)
      await apiService.updateObjective(objectiveId, { 
        current_amount: objective.target_amount 
      });
      
      await refreshData();
      alert('🎉 Parabéns! Objetivo concluído!');
    } catch (error) {
      alert(`Erro ao concluir objetivo: ${error.message}`);
    }
  };
  
  if (!localObjectives || localObjectives.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIconContainer}>
          {showCompleted ? <FaTrophy size={50} /> : <FaBullseye size={50} />}
        </div>
        <p className={styles.emptyText}>
          {showCompleted ? 'Nenhum objetivo concluído' : 'Nenhum objetivo ativo'}
        </p>
        <p className={styles.emptySubtext}>
          {showCompleted 
            ? 'Complete seus objetivos para vê-los aqui!' 
            : 'Crie seu primeiro objetivo financeiro para começar.'}
        </p>
        <div className={styles.tipContainer}>
          <MdInfoOutline size={16} />
          <p className={styles.tipText}>
            {showCompleted 
              ? 'Objetivos concluídos ficam salvos aqui para seu histórico.' 
              : 'O progresso é calculado com base no seu saldo atual.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {localObjectives.map(item => (
        <ObjectiveItem
          key={item.id}
          item={item}
          currentBalance={balance} // ✅ MUDANÇA: Passar o saldo atual
          onUpdateObjective={handleObjectiveUpdated}
          onDeleteObjective={handleObjectiveDeleted}
          onCompleteObjective={handleObjectiveCompleted} // ✅ NOVO
        />
      ))}
    </div>
  );
};

export default ObjectivesList;
