import React, { useState, useEffect } from 'react';
import { MdEdit, MdDelete, MdInfoOutline, MdEvent, MdCheckCircle } from 'react-icons/md';
import { FaBullseye, FaTrophy } from 'react-icons/fa';
import styles from './ObjectiveList.module.css';
import { useFinancial } from '../contexts/FinancialContext';
import ObjectiveModal from './ObjectiveModal'; // Reaproveita o Modal Novo
import apiService from '../services/api';

const ObjectiveItem = ({ item, realProfit, onUpdateObjective, onDeleteObjective, onCompleteObjective }) => {
  const [showActions, setShowActions] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const getDaysRemaining = (deadline) => Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));

  const effectiveProfit = Math.max(0, realProfit);
  const progress = Math.min((effectiveProfit / item.target_amount) * 100, 100);
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
    if (window.confirm(`Excluir objetivo "${item.title}"?`)) {
      setIsDeleting(true);
      setTimeout(() => onDeleteObjective(item.id), 300); 
    }
  };

  const handleCheckboxChange = async (e) => {
    e.stopPropagation();
    if (item.status !== 'completed') {
      if (window.confirm(`Concluir objetivo "${item.title}"?`)) {
        await onCompleteObjective(item.id);
      }
    }
  };

  // Cores SVG atualizadas para o tema elegante
  const getProgressGradientId = (p) => {
    if (p >= 80) return 'gradientEmerald';
    if (p >= 50) return 'gradientGold';
    if (p >= 25) return 'gradientBronze';
    return 'gradientBlood';
  };

  const RADIUS = 35;
  const STROKE_WIDTH = 6; // Mais fino e elegante
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progressStroke = (CIRCUMFERENCE * progress) / 100;

  return (
    <>
      <div className={`${styles.objectiveItem} ${isDeleting ? styles.isDeleting : ''} ${item.status === 'completed' ? styles.completedItem : ''}`} onClick={() => setShowActions(!showActions)}>
        <div className={styles.objectiveHeader}>
          <h3 className={styles.objectiveTitle}>{item.title}</h3>
          <div className={styles.headerRight}>
            <span className={styles.objectiveProgress}>{progress.toFixed(1)}%</span>
            
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
                {/* Esmeralda Profundo */}
                <linearGradient id="gradientEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2E7D32"/>
                  <stop offset="100%" stopColor="#66BB6A"/>
                </linearGradient>
                {/* Ouro Rico */}
                <linearGradient id="gradientGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B8860B"/>
                  <stop offset="100%" stopColor="#FFD700"/>
                </linearGradient>
                {/* Bronze Antigo */}
                <linearGradient id="gradientBronze" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8D6E63"/>
                  <stop offset="100%" stopColor="#D7CCC8"/>
                </linearGradient>
                {/* Vermelho Sangue */}
                <linearGradient id="gradientBlood" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B0000"/>
                  <stop offset="100%" stopColor="#B71C1C"/>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r={RADIUS} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={STROKE_WIDTH} fill="none" />
              <circle cx="50" cy="50" r={RADIUS} stroke={`url(#${getProgressGradientId(progress)})`} strokeWidth={STROKE_WIDTH} strokeDasharray={`${progressStroke}, ${CIRCUMFERENCE}`} strokeLinecap="round" transform="rotate(-90 50 50)" fill="none" />
            </svg>
            <div className={styles.donutTextOverlay}>
              <span className={styles.donutTextPercent}>{`${Math.round(progress)}%`}</span>
            </div>
          </div>
          <div className={styles.objectiveDetails}>
            <p className={styles.profitLabel}>Progresso Real</p>
            <p className={`${styles.currentAmount} ${realProfit < 0 ? styles.negativeProfit : ''}`}>
              {formatCurrency(realProfit)}
            </p>
            <p className={styles.targetAmount}>Alvo: {formatCurrency(item.target_amount)}</p>
            
            <div className={styles.deadlineDateContainer}>
              <MdEvent size={12} />
              <span>{formatDate(item.target_date)}</span>
              <span className={styles.deadline}>
                {daysRemaining > 0 ? `${daysRemaining} dias` : daysRemaining === 0 ? 'Hoje' : 'Expirado'}
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.actionButtonsContainer} ${showActions ? styles.actionsVisible : ''}`}>
          <button onClick={handleEdit}>
            <MdEdit /> Editar
          </button>
          <button onClick={handleDelete} className={styles.deleteButton}>
            <MdDelete /> Excluir
          </button>
        </div>
      </div>
      
      {/* Usa o novo Modal Elegante */}
      <ObjectiveModal 
        visible={editModalVisible} 
        objective={item} 
        onClose={() => setEditModalVisible(false)} 
      />
    </>
  );
};

const ObjectivesList = ({ showCompleted = false }) => {
  const { objectives, getRealProfit, deleteObjective, refreshData } = useFinancial();
  const [localObjectives, setLocalObjectives] = useState([]);
  const realProfit = getRealProfit();

  useEffect(() => {
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
      setLocalObjectives(objectives);
    }
  };
  
  const handleObjectiveCompleted = async (objectiveId) => {
    try {
      const objective = localObjectives.find(obj => obj.id === objectiveId);
      await apiService.updateObjective(objectiveId, { current_amount: objective.target_amount, status: 'completed' });
      await refreshData();
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };
  
  if (!localObjectives || localObjectives.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div style={{ color: '#D4AF37', opacity: 0.5, marginBottom: 10 }}>
          {showCompleted ? <FaTrophy size={40} /> : <FaBullseye size={40} />}
        </div>
        <p className={styles.emptyText}>
          {showCompleted ? 'Histórico Vazio' : 'Sem Objetivos Ativos'}
        </p>
        <p className={styles.emptySubtext}>
          {showCompleted ? 'Suas conquistas aparecerão aqui.' : 'Defina uma meta de lucro.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {localObjectives.map(item => (
        <ObjectiveItem
          key={item.id}
          item={item}
          realProfit={realProfit}
          onDeleteObjective={handleObjectiveDeleted}
          onCompleteObjective={handleObjectiveCompleted}
        />
      ))}
    </div>
  );
};

export default ObjectivesList;