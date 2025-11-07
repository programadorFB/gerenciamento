import React, { useMemo, useState, useEffect } from 'react';
import {
  MdWarning,
  MdErrorOutline,
  MdInfo,
  MdCheckCircle,
  MdHelpOutline,
  MdShield,
  MdLocalFireDepartment,
  MdDangerous,
  MdBalance
} from 'react-icons/md';
import styles from './StopLossCard.module.css';

const StopLossCard = React.memo(({
  balance,
  initialBalance,
  formatCurrency,
  stopLossPercentage = 0,
  onStopLossChange
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayPercentage, setDisplayPercentage] = useState(stopLossPercentage);
  const [prevStatus, setPrevStatus] = useState('undefined');

  // Garantir que os valores sejam números
  const validInitialBalance = Number(initialBalance) || 0;
  const validBalance = Number(balance) || 0;

  // Cálculo do valor do stop loss com base na prop
  // O valor já vem como porcentagem de 0-10% (escala 0-10)
  const stopLossValue = useMemo(() => {
    if (!validInitialBalance || !stopLossPercentage) return 0;
    return validInitialBalance * (stopLossPercentage / 100);
  }, [validInitialBalance, stopLossPercentage]);

  // Calcular perda atual (banca inicial - saldo atual)
  const currentLoss = useMemo(() => {
    if (!validInitialBalance) return 0;
    const loss = validInitialBalance - validBalance;
    return Math.max(0, loss);
  }, [validInitialBalance, validBalance]);

  // Calcular porcentagem de perda atual
  const currentLossPercentage = useMemo(() => {
    if (!validInitialBalance || validInitialBalance <= 0) return 0;
    return (currentLoss / validInitialBalance) * 100;
  }, [currentLoss, validInitialBalance]);

  // Obter cor baseada no valor do stop loss configurado
  const getSliderColor = () => {
    if (stopLossPercentage === 0) return '#9E9E9E'; // Cinza
    if (stopLossPercentage <= 2) return '#0054E3'; // Azul (Seguro)
    if (stopLossPercentage <= 4) return '#0054E3'; // Azul
    if (stopLossPercentage <= 6) return '#0054E3'; // Azul
    if (stopLossPercentage <= 8) return '#FF9800'; // Laranja (Alerta)
    return '#BF0000'; // Vermelho - Alto risco
  };

  // Obter ícone baseado no valor do stop loss
  const getSliderIcon = () => {
    if (stopLossPercentage === 0) return <MdHelpOutline />;
    if (stopLossPercentage <= 3) return <MdShield />; 
    if (stopLossPercentage <= 6) return <MdBalance />; 
    if (stopLossPercentage <= 8) return <MdLocalFireDepartment />; 
    return <MdLocalFireDepartment />; 
  };

  // Obter título baseado no valor do stop loss
  const getSliderTitle = () => {
    if (stopLossPercentage === 0) return 'NÃO DEFINIDO';
    if (stopLossPercentage <= 3) return 'PROTEÇÃO CONSERVADORA';
    if (stopLossPercentage <= 6) return 'PROTEÇÃO MODERADA';
    if (stopLossPercentage <= 8) return 'PROTEÇÃO ARRISCADA';
    return 'PROTEÇÃO MUITO ARRISCADA';
  };
  
  // Verificar status do stop loss (baseado na perda atual vs limite)
  const getRiskStatus = () => {
    if (stopLossPercentage <= 0 || stopLossValue <= 0) return 'undefined';
    if (currentLoss >= stopLossValue) return 'critical';
    if (currentLoss >= stopLossValue * 0.9) return 'high';
    if (currentLoss >= stopLossValue * 0.5) return 'medium';
    return 'low';
  };

  const getStatusInfo = () => {
    const status = getRiskStatus();
    
    switch (status) {
      case 'critical':
        return {
          color: '#BF0000', // Vermelho XP
          icon: <MdWarning />,
          title: 'STOP LOSS ATINGIDO!',
          message: `Limite de ${stopLossPercentage.toFixed(1)}% foi ultrapassado (${currentLossPercentage.toFixed(1)}%)`,
          description: 'Pare imediatamente as apostas!'
        };
      case 'high':
        return {
          color: '#E69100', // Laranja XP
          icon: <MdErrorOutline />,
          title: 'RISCO ALTO',
          message: `Muito próximo do limite (${currentLossPercentage.toFixed(1)}% de ${stopLossPercentage.toFixed(1)}%)`,
          description: 'Considere parar ou reduzir apostas'
        };
      case 'medium':
        return {
          color: '#0054E3', // Azul XP
          icon: <MdInfo />,
          title: 'ATENÇÃO',
          message: `Monitorar loss (${currentLossPercentage.toFixed(1)}% de ${stopLossPercentage.toFixed(1)}%)`,
          description: 'Mantenha-se atento aos seus limites'
        };
      case 'low':
        return {
          color: '#0054E3', // Azul XP
          icon: <MdCheckCircle />,
          title: 'SEGURO',
          message: `Dentro do limite estabelecido (${currentLossPercentage.toFixed(1)}% de ${stopLossPercentage.toFixed(1)}%)`,
          
        };
      default:
        return {
          color: '#7F9DB9', // Cinza XP
          icon: <MdHelpOutline />,
          title: 'NÃO DEFINIDO',
          message: 'Configure seu stop loss para proteção',
          description: 'Use o slider acima para configurar'
        };
    }
  };

  const statusInfo = useMemo(() => getStatusInfo(), [
    stopLossPercentage,
    currentLossPercentage,
    currentLoss,
    stopLossValue
  ]);

  const sliderColor = useMemo(() => getSliderColor(), [stopLossPercentage]);
  const sliderIcon = useMemo(() => getSliderIcon(), [stopLossPercentage]);
  const sliderTitle = useMemo(() => getSliderTitle(), [stopLossPercentage]);

  // Detectar mudança de status para animar
  useEffect(() => {
    const currentStatus = getRiskStatus();
    if (currentStatus !== prevStatus && prevStatus !== 'undefined') {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevStatus(currentStatus);
  }, [stopLossPercentage, currentLoss]);

  // Animação da porcentagem quando muda
  useEffect(() => {
    const duration = 500;
    const steps = 20;
    const startValue = displayPercentage;
    const difference = stopLossPercentage - startValue;
    const increment = difference / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayPercentage(prev => prev + increment);
      } else {
        setDisplayPercentage(stopLossPercentage);
        clearInterval(interval);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [stopLossPercentage]);

  // Calcular progresso da barra
  const progressWidth = useMemo(() => {
    if (stopLossPercentage <= 0 || stopLossValue <= 0) return 0;
    const progress = Math.min((currentLoss / stopLossValue) * 100, 100);
    return progress;
  }, [currentLoss, stopLossValue, stopLossPercentage]);

  // Handler que chama a função do componente pai
  const handleSliderChange = (event) => {
    if (onStopLossChange) {
      onStopLossChange(parseFloat(event.target.value));
    }
  };
  
  const cardStyle = {
    '--status-color': statusInfo.color,
    '--slider-color': sliderColor,
    '--border-color': sliderColor, // CSS do XP não usa isso
    '--progress-width': `${progressWidth}%`,
    
  };

  return (
    // 👇 MODIFICADO: de <div> para <fieldset>
    <fieldset className={`${styles.container} ${isAnimating ? styles.statusChange : ''}`} style={cardStyle}>
      
      {/* 👇 MODIFICADO: de <header> para <legend> */}
      <legend className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={`${styles.iconWrapper} ${isAnimating ? styles.iconPulse : ''}`} style={{ color: statusInfo.color }}>
            {statusInfo.icon}
          </div>
          <div className={styles.headerText}>
            {/* 👇 MODIFICADO: de <h3> para <span> */}
            <span className={styles.title} style={{ color: statusInfo.color }}>
              {statusInfo.title}
            </span>
            {/* O subtítulo foi removido para caber na <legend> */}
          </div>
        </div>
      </legend>
      
      {/* 👇 MODIFICADO: .gradient removido, .content agora é filho direto */}
      <div className={styles.content}>
        <div className={styles.sliderSection}>
          <div className={styles.sliderHeader}>
            <div className={`${styles.sliderIconWrapper} ${isAnimating ? styles.iconPulse : ''}`} 
                 style={{ color: sliderColor }}>
              {sliderIcon}
            </div>
            <div className={styles.sliderHeaderText}>
              <h4 className={styles.sliderTitle} style={{ color: sliderColor }}>
                {sliderTitle}
              </h4>
              <p className={styles.sliderSubtitle}>Configure seu limite de Loss</p>
            </div>
          </div>
          
          <div className={styles.percentageItem}>
            <span className={styles.percentageLabel}>Limite configurado</span>
            <span className={`${styles.percentageValue} ${isAnimating ? styles.valueAnimating : ''}`}
                  style={{ color: sliderColor }}>
              {stopLossPercentage > 0 ? `${displayPercentage.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={stopLossPercentage}
              onChange={handleSliderChange}
              className={styles.slider}
            />

            {/* O .sliderTrack e .sliderFill foram removidos, o input é estilizado diretamente */}

            {/* RÉGUA SOMENTE COM NÚMEROS CLICÁVEIS */}
            <div className={styles.numberRuler}>
              {[...Array(11)].map((_, i) => (
                <span
                  key={i}
                  className={`${styles.numberMark} ${i === Math.round(stopLossPercentage) ? styles.activeNumber : ''}`}
                  onClick={() => onStopLossChange(i)}
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Barra de progresso visual */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={`${styles.progressFill} ${progressWidth >= 90 ? styles.progressCritical : ''}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <p className={styles.progressText}>
            Consumido: {progressWidth.toFixed(1)}% do limite
          </p>
        </div>

        <div className={styles.amountSection}>
          <div className={styles.amountItem}>
            <span className={styles.amountLabel}>Valor StopLoss</span>
            <span className={styles.amountValue}>
              {stopLossPercentage > 0 ? formatCurrency(stopLossValue) : 'N/A'}
            </span>
          </div>
        </div>

        <div className={`${styles.statusMessage} ${isAnimating ? styles.messageSlide : ''}`}>
          <p className={styles.messageText}>{statusInfo.message}</p>
          {statusInfo.description && <p className={styles.descriptionText}>{statusInfo.description}</p>}
        </div>
      </div>
                  
    </fieldset>
  );
  
});

StopLossCard.displayName = 'StopLossCard';

export default StopLossCard;