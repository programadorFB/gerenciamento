import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useFinancial } from '../contexts/FinancialContext';
import styles from './ObjectiveModal.module.css';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa'; // Ícones opcionais para polimento

// Registrar locale português
registerLocale('pt-BR', ptBR);

const ObjectiveModal = ({ visible, onClose, objective = null }) => {
  const { addObjective, updateObjective, loading: contextLoading } = useFinancial();
  
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: null
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset e inicialização do formulário
  useEffect(() => {
    if (visible) {
      if (objective) {
        const deadlineDate = objective.target_date || objective.deadline;
        setFormData({
          title: objective.title || '',
          targetAmount: objective.target_amount?.toString() || '',
          currentAmount: objective.current_amount?.toString() || '0',
          deadline: deadlineDate ? new Date(deadlineDate) : null
        });
      } else {
        setFormData({
          title: '',
          targetAmount: '',
          currentAmount: '0',
          deadline: null
        });
      }
      setErrors({});
    }
  }, [visible, objective]);

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDateChange = (date) => {
    handleInputChange('deadline', date);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título obrigatório';
    }
    
    const amount = parseFloat(formData.targetAmount.replace(',', '.'));
    if (!formData.targetAmount || isNaN(amount) || amount <= 0) {
      newErrors.targetAmount = 'Valor inválido';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Data obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const payload = {
      title: formData.title.trim(),
      target_amount: parseFloat(formData.targetAmount.replace(',', '.')),
      current_amount: parseFloat(formData.currentAmount.replace(',', '.')) || 0,
      target_date: formData.deadline.toISOString().split('T')[0]
    };

    let response;
    if (objective?.id) {
      response = await updateObjective(objective.id, payload);
    } else {
      response = await addObjective(payload);
    }

    setLoading(false);

    if (response.success) {
      onClose();
    } else {
      alert(`Erro: ${response.error || 'Não foi possível salvar'}`);
    }
  };

  const handleModalClose = () => {
    onClose();
  };

  const setQuickDate = (months) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    handleInputChange('deadline', date);
  };

  const calculateProgress = () => {
    const current = parseFloat(formData.currentAmount.replace(',', '.')) || 0;
    const target = parseFloat(formData.targetAmount.replace(',', '.')) || 0;
    
    if (target <= 0) return { percentage: 0, valid: false };
    
    const percentage = Math.min((current / target) * 100, 100);
    return { percentage, valid: true };
  };

  const progress = calculateProgress();
  const canSave = formData.title.trim() && formData.targetAmount && formData.deadline && !loading && !contextLoading;

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {objective?.id ? 'Editar Objetivo' : 'Novo Objetivo'}
          </h2>
          <button type="button" onClick={handleModalClose} className={styles.closeIconBtn}>
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {/* Título */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Reserva de Emergência"
              className={`${styles.fieldInput} ${errors.title ? styles.fieldInputError : ''}`}
            />
            {errors.title && <span className={styles.errorMessage}>{errors.title}</span>}
          </div>

          {/* Valor Meta */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Valor Meta (R$)</label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => handleInputChange('targetAmount', e.target.value)}
              placeholder="0,00"
              className={`${styles.fieldInput} ${errors.targetAmount ? styles.fieldInputError : ''}`}
            />
          </div>

          {/* Data Meta */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Prazo Final</label>
            <div className={styles.datePickerWrapper}>
              <DatePicker
                selected={formData.deadline}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecionar data"
                className={styles.datePickerInput}
                calendarClassName={styles.customCalendar}
                minDate={new Date()}
                showPopperArrow={false}
                locale="pt-BR"
              />
              <FaCalendarAlt className={styles.calendarIcon} />
            </div>
             {errors.deadline && <span className={styles.errorMessage}>{errors.deadline}</span>}
            
            {/* Atalhos de data (Chips) */}
            <div className={styles.quickDateContainer}>
              <button type="button" onClick={() => setQuickDate(3)} className={styles.chipButton}>
                +3 Meses
              </button>
              <button type="button" onClick={() => setQuickDate(6)} className={styles.chipButton}>
                +6 Meses
              </button>
              <button type="button" onClick={() => setQuickDate(12)} className={styles.chipButton}>
                +1 Ano
              </button>
            </div>
          </div>

          {/* Preview de Progresso */}
          {progress.valid && (
            <div className={styles.progressPreview}>
              <div className={styles.progressHeader}>
                 <span className={styles.progressLabel}>Simulação</span>
                 <span className={styles.progressValue}>{progress.percentage.toFixed(1)}%</span>
              </div>
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button type="button" onClick={handleModalClose} className={styles.btnCancel}>
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            disabled={!canSave}
            className={styles.btnSave}
          >
            {loading || contextLoading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveModal;