import React, { useState, useEffect } from 'react';
import { MdClose, MdEdit, MdDelete, MdInfoOutline, MdTouchApp, MdEvent } from 'react-icons/md';
import { FaBullseye } from 'react-icons/fa';
import styles from './ObjectiveList.module.css';

// 1. Importar o seu serviço de API
//    Ajuste o caminho se necessário
import apiService from '../services/api';

// --- COMPONENTE DO MODAL DE EDIÇÃO ---
const EditObjectiveModal = ({ visible, objective, onClose, onSave }) => {
  const [editedObjective, setEditedObjective] = useState({});
  const [errors, setErrors] = useState({});
  // Adiciona um estado de carregamento para o botão de salvar
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
    // ... (nenhuma alteração na validação)
    const newErrors = {};
    if (!editedObjective.title?.trim()) newErrors.title = 'Título é obrigatório';
    if (!editedObjective.target_amount || editedObjective.target_amount <= 0) newErrors.target_amount = 'Meta deve ser maior que zero';
    if (editedObjective.current_amount < 0) newErrors.current_amount = 'Valor atual não pode ser negativo';
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

  // Transforma handleSave em uma função assíncrona para aguardar a API
  const handleSave = async () => {
    if (!validateFields()) {
      alert('Erro: Por favor, corrija os campos antes de salvar.');
      return;
    }

    setLoading(true);
    try {
      await onSave({ // onSave agora é uma Promise
        ...editedObjective,
        title: editedObjective.title.trim(),
        current_amount: parseFloat(editedObjective.current_amount) || 0,
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
        {/* ... */}
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar Objetivo</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <MdClose size={24} />
          </button>
        </header>
        <div className={styles.modalContent}>
          {/* ... (inputs sem alteração) ... */}
           <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Título do Objetivo *</label>
            <input name="title" type="text" className={`${styles.textInput} ${errors.title ? styles.inputError : ''}`} value={editedObjective.title || ''} onChange={handleChange} placeholder="Ex: Comprar um carro" />
            {errors.title && <p className={styles.errorText}>{errors.title}</p>}
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.inputLabel}>Valor Atual (R$)</label>
            <input name="current_amount" type="text" inputMode="decimal" className={`${styles.textInput} ${errors.current_amount ? styles.inputError : ''}`} value={editedObjective.current_amount || ''} onChange={handleAmountChange} placeholder="0,00" />
            {errors.current_amount && <p className={styles.errorText}>{errors.current_amount}</p>}
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
          {/* Desabilita o botão enquanto salva */}
          <button className={styles.saveButton} onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </footer>
      </div>
    </div>
  );
};

// --- COMPONENTE DO ITEM INDIVIDUAL ---
const ObjectiveItem = ({ item, onUpdateObjective, onDeleteObjective }) => {
  const [showActions, setShowActions] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const getDaysRemaining = (deadline) => Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));

  const progress = Math.min((item.current_amount / item.target_amount) * 100, 100);
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
      // A UI é removida após a animação, e a API é chamada no componente pai
      setTimeout(() => onDeleteObjective(item.id), 300); 
    }
  };
  
  // A função se torna assíncrona
  const handleSaveObjective = async (editedObjective) => {
    // onUpdateObjective agora retorna uma Promise da chamada da API
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
      <div className={`${styles.objectiveItem} ${isDeleting ? styles.isDeleting : ''}`} onClick={() => setShowActions(!showActions)}>
        {/* ... (conteúdo visual do item) ... */}
        <div className={styles.objectiveHeader}>
            <h3 className={styles.objectiveTitle}>{item.title}</h3>
            <span className={styles.objectiveProgress}>{progress.toFixed(1)}%</span>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.donutContainer}>
            <svg height="90" width="90" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#66BB6A"/><stop offset="100%" stopColor="#4CAF50"/></linearGradient>
                    <linearGradient id="gradientGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFEB3B"/><stop offset="100%" stopColor="#FFD700"/></linearGradient>
                    <linearGradient id="gradientOrange" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFA726"/><stop offset="100%" stopColor="#FF9800"/></linearGradient>
                    <linearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#EF5350"/><stop offset="100%" stopColor="#F44336"/></linearGradient>
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
              <p className={styles.currentAmount}>{formatCurrency(item.current_amount)}</p>
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
        <div className={`${styles.actionButtonsContainer} ${showActions ? styles.actionsVisible : ''}`}>
            <button onClick={handleEdit}><MdEdit /> Editar</button>
            <button onClick={handleDelete} className={styles.deleteButton}><MdDelete /> Excluir</button>
        </div>
      </div>
      <EditObjectiveModal visible={editModalVisible} objective={item} onClose={() => setEditModalVisible(false)} onSave={handleSaveObjective} />
    </>
  );
};


// --- COMPONENTE PRINCIPAL DA LISTA ---
const ObjectivesList = ({ objectives, onUpdateObjective, onDeleteObjective }) => {
  const [localObjectives, setLocalObjectives] = useState(objectives);

  useEffect(() => {
    setLocalObjectives(objectives);
  }, [objectives]);
  
  // 2. A função de exclusão agora chama a API
  const handleObjectiveDeleted = async (deletedId) => {
    // Atualização otimista da UI
    setLocalObjectives(current => current.filter(obj => obj.id !== deletedId));
    
    try {
      await apiService.deleteObjective(deletedId);
      // Se a prop onDeleteObjective for usada para outra coisa (ex: atualizar o context), chame-a aqui
      if (onDeleteObjective) onDeleteObjective(deletedId);
    } catch (error) {
      alert(`Erro ao excluir objetivo: ${error.message}`);
      // Reverte a UI em caso de erro
      setLocalObjectives(objectives);
    }
  };
  
  // 3. A função de atualização agora chama a API
  const handleObjectiveUpdated = async (id, updatedData) => {
    // Atualiza o estado local para uma resposta rápida da UI
    setLocalObjectives(currentObjs =>
      currentObjs.map(obj => (obj.id === id ? { ...obj, ...updatedData } : obj))
    );

    try {
      // Chama a API para salvar
      await apiService.updateObjective(id, updatedData);
      // Chama a prop original se ela existir
      if (onUpdateObjective) onUpdateObjective(id, updatedData);
    } catch(error) {
        alert(`Erro ao atualizar objetivo: ${error.message}`);
        // Reverte a UI em caso de erro
        setLocalObjectives(objectives);
    }
  };
  
  if (!localObjectives || localObjectives.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIconContainer}><FaBullseye size={50} /></div>
        <p className={styles.emptyText}>Nenhum objetivo encontrado</p>
        <p className={styles.emptySubtext}>Crie seu primeiro objetivo financeiro para começar.</p>
        <div className={styles.tipContainer}>
          <MdInfoOutline size={16} />
          <p className={styles.tipText}>Clique em um objetivo para editá-lo ou excluí-lo.</p>
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
          // 4. Passa as novas funções que se comunicam com a API
          onUpdateObjective={handleObjectiveUpdated}
          onDeleteObjective={handleObjectiveDeleted}
        />
      ))}
    </div>
  );
};

export default ObjectivesList;