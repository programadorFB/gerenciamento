import React, { useState, useEffect, useRef } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import styles from './ObjectiveModal.module.css';

// #region --- SimpleDatePicker Component (Ported for Web) ---
const SimpleDatePicker = ({ visible, onClose, onDateSelect, selectedDate }) => {
  const [year, setYear] = useState(selectedDate ? new Date(selectedDate).getFullYear() : new Date().getFullYear());
  const [month, setMonth] = useState(selectedDate ? new Date(selectedDate).getMonth() : new Date().getMonth());
  const [day, setDay] = useState(selectedDate ? new Date(selectedDate).getDate() : new Date().getDate());

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handleDateConfirm = () => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(formattedDate);
    onClose();
  };

  const setToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setDay(today.getDate());
  };

  const changeMonth = (increment) => {
    let newMonth = month + increment;
    let newYear = year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setMonth(newMonth);
    setYear(newYear);
  };
  const changeYear = (increment) => {
    setYear(year + increment);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const dayElements = [];

    for (let i = 0; i < firstDay; i++) {
      dayElements.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = i === day;
      const today = new Date();
      const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      
      const dayClasses = [
        styles.calendarDay,
        isSelected && styles.calendarDaySelected,
        isToday && !isSelected && styles.calendarDayToday,
      ].filter(Boolean).join(' ');

      dayElements.push(
        <button key={i} className={dayClasses} onClick={() => setDay(i)}>
          {i}
        </button>
      );
    }
    return dayElements;
  };
  
  if (!visible) return null;

  return (
    <div className={styles.datePickerOverlay}>
      <div className={styles.datePickerContainer}>
        <div className={styles.datePickerHeader}>
          <span className={styles.datePickerTitle}>{months[month]} {year}</span>
          <button onClick={onClose} className={styles.datePickerCloseButton}>✕</button>
        </div>
        
        <div className={styles.calendarContainer}>
          <div className={styles.calendarHeader}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
              <span key={dayName} className={styles.calendarHeaderText}>{dayName}</span>
            ))}
          </div>
          <div className={styles.calendarGrid}>{renderCalendarDays()}</div>
        </div>

        <div className={styles.datePickerActions}>
          <button className={styles.datePickerTodayButton} onClick={setToday}>Hoje</button>
          <button className={styles.datePickerConfirmButton} onClick={handleDateConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};
// #endregion

// #region --- DateInputWithPicker Component (Ported for Web) ---
const DateInputWithPicker = ({ value, onDateChange, style, ...props }) => {
  const [pickerVisible, setPickerVisible] = useState(false);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Ensure correct timezone interpretation
    return date.toLocaleString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.dateInputContainer}>
      <div className={styles.dateInputWrapper}>
        <input
          type="text"
          value={formatDisplayDate(value)}
          placeholder="Selecione a data meta"
          readOnly
          className={`${styles.input} ${styles.dateInput} ${style || ''}`}
          onClick={() => setPickerVisible(true)}
          {...props}
        />
        <button className={styles.calendarIcon} onClick={() => setPickerVisible(true)}>
          <span role="img" aria-label="calendar">📅</span>
        </button>
      </div>
      <SimpleDatePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onDateSelect={onDateChange}
        selectedDate={value}
      />
    </div>
  );
};
// #endregion

// #region --- Main ObjectiveModal Component (Ported for Web) ---
const ObjectiveModal = ({ visible, onClose, objective = null }) => {
  const { addObjective, updateObjective, loading: contextLoading } = useFinancial();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline('');
  };

  useEffect(() => {
    if (visible) {
      if (objective) {
        setTitle(objective.title || '');
        setTargetAmount(objective.target_amount?.toString() || '');
        setCurrentAmount(objective.current_amount?.toString() || '0');
        const dateToSet = objective.target_date || objective.deadline;
        if (dateToSet) {
          setDeadline(new Date(dateToSet).toISOString().split('T')[0]);
        }
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [objective, visible]);
  
  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Título é obrigatório.';
    if (!targetAmount.trim() || parseFloat(targetAmount.replace(',', '.')) <= 0) {
      newErrors.targetAmount = 'Valor meta deve ser maior que zero.';
    }
    if (!deadline) newErrors.deadline = 'Data meta é obrigatória.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const numericTarget = parseFloat(targetAmount.replace(',', '.')) || 0;
    const numericCurrent = parseFloat(currentAmount.replace(',', '.')) || 0;

    const payload = {
      title: title.trim(),
      target_amount: numericTarget,
      current_amount: numericCurrent,
      target_date: deadline,
    };

    let response;
    if (objective?.id) {
      response = await updateObjective(objective.id, payload);
    } else {
      response = await addObjective(payload);
    }

    setLoading(false);

    if (response.success) {
      alert(objective?.id ? 'Objetivo atualizado com sucesso!' : 'Objetivo criado com sucesso!');
      onClose();
    } else {
      alert(`Erro: ${response.error || 'Não foi possível salvar o objetivo.'}`);
    }
  };
  
  const handleClose = () => {
    const hasUnsavedChanges = title || targetAmount || (currentAmount && currentAmount !== '0') || deadline;
    if (hasUnsavedChanges) {
      if (window.confirm('Descartar alterações? Você tem alterações não salvas.')) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };
  
  const generateSuggestedDate = (months) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  const calculateProgress = () => {
    const current = parseFloat(currentAmount.replace(',', '.')) || 0;
    const target = parseFloat(targetAmount.replace(',', '.')) || 0;
    if (target <= 0) return { percentage: 0, isValid: false };
    const percentage = Math.min((current / target) * 100, 100);
    return { percentage, isValid: true, current, target };
  };

  const progressData = calculateProgress();
  const isFormValid = title.trim() && targetAmount && deadline && !loading && !contextLoading;

  if (!visible) return null;

  return (
    <div className={`${styles.modalOverlay} ${visible ? styles.modalVisible : ''}`}>
      <div className={`${styles.modalContent} ${visible ? styles.contentVisible : ''}`}>
        <header className={styles.header}>
          <button className={styles.cancelButton} onClick={handleClose}>Cancelar</button>
          <h2 className={styles.headerTitle}>{objective?.id ? 'Editar Objetivo' : 'Novo Objetivo'}</h2>
          <button className={styles.saveButton} onClick={handleSave} disabled={!isFormValid}>
            {loading || contextLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.inputContainer}>
            <label className={styles.label}>
              Título do Objetivo *
              {errors.title && <span className={styles.errorText}> - {errors.title}</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Reserva de Emergência"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            />
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Valor Meta *</label>
            <input
              type="text"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0,00"
              className={styles.input}
            />
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Valor Atual</label>
            <input
              type="text"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0,00"
              className={styles.input}
            />
          </div>
          
          <div className={styles.inputContainer}>
            <label className={styles.label}>Data Meta *</label>
            <DateInputWithPicker value={deadline} onDateChange={setDeadline} />
            <div className={styles.dateSuggestions}>
              <span className={styles.suggestionLabel}>Rápido:</span>
              <div className={styles.suggestionButtons}>
                <button className={styles.suggestionButton} onClick={() => setDeadline(generateSuggestedDate(3))}>3 meses</button>
                <button className={styles.suggestionButton} onClick={() => setDeadline(generateSuggestedDate(6))}>6 meses</button>
                <button className={styles.suggestionButton} onClick={() => setDeadline(generateSuggestedDate(12))}>1 ano</button>
              </div>
            </div>
          </div>

          {progressData.isValid && (
            <div className={styles.previewContainer}>
              <h3 className={styles.previewTitle}>Prévia do Progresso</h3>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressData.percentage}%` }}
                />
              </div>
              <p className={styles.progressText}>{progressData.percentage.toFixed(1)}% concluído</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default ObjectiveModal;