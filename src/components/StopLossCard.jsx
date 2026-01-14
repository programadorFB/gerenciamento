import React, { useMemo, useState, useEffect } from 'react';
import {
  MdShield,
  MdSecurity,
  MdWarning,
  MdDangerous,
  MdLockOutline
} from 'react-icons/md';
import styles from './StopLossCard.module.css';

const StopLossCard = React.memo(({
  balance,
  initialBalance,
  formatCurrency,
  stopLossPercentage = 0,
  onStopLossChange,
  onEdit // Função opcional para abrir modal de edição se necessário
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Garantir números
  const validInitialBalance = Number(initialBalance) || 0;
  const validBalance = Number(balance) || 0;

  // Cálculos
  const stopLossValue = useMemo(() => {
    if (!validInitialBalance || !stopLossPercentage) return 0;
    return validInitialBalance * (stopLossPercentage / 100);
  }, [validInitialBalance, stopLossPercentage]);

  const currentLoss = useMemo(() => {
    const loss = validInitialBalance - validBalance;
    return loss > 0 ? loss : 0;
  }, [validInitialBalance, validBalance]);

  // Lógica de Cores e Ícones (Tema Cassino)
  // 0-3%: Azul (Safe/Defense)
  // 4-7%: Dourado (Caution/Mid)
  // 8-10%: Vermelho (Critical/Attack)
  const statusInfo = useMemo(() => {
    if (stopLossPercentage === 0) {
      return {
        color: '#666',
        icon: <MdLockOutline />,
        message: 'Proteção Desativada',
        description: 'Sua banca está exposta a variações totais.'
      };
    }
    if (stopLossPercentage <= 3) {
      return {
        color: '#2979FF', // Azul Neon
        icon: <MdShield />,
        message: 'Modo Defensivo',
        description: 'Alta proteção. Ideal para estratégias conservadoras.'
      };
    }
    if (stopLossPercentage <= 7) {
      return {
        color: '#D4AF37', // Dourado
        icon: <MdSecurity />,
        message: 'Modo Equilibrado',
        description: 'Balanço entre proteção e margem de operação.'
      };
    }
    return {
      color: '#FF4D4D', // Vermelho Neon
      icon: <MdDangerous />,
      message: 'Modo Agressivo',
      description: 'Alta exposição. Risco elevado de atingir o limite.'
    };
  }, [stopLossPercentage]);

  // Efeito de animação ao mudar texto
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [statusInfo.message]);

  // Porcentagem de consumo do Stop Loss (Barra de Vida)
  const progressWidth = useMemo(() => {
    if (stopLossValue === 0) return 0;
    const pct = (currentLoss / stopLossValue) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }, [currentLoss, stopLossValue]);

  return (
    <fieldset 
      className={styles.container}
      style={{ '--status-color': statusInfo.color }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            {statusInfo.icon}
          </div>
          <h3 className={styles.title}>Sistema de Defesa</h3>
        </div>
      </div>

      <div className={styles.content}>
        
        {/* Mostrador Principal */}
        <div className={styles.percentageItem}>
          <span className={styles.percentageLabel}>Limite Definido</span>
          <span className={styles.percentageValue}>
            {stopLossPercentage}%
          </span>
        </div>

        {/* Slider */}
        <div className={styles.sliderSection}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderTitle}>Ajuste Fino</span>
          </div>
          
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={stopLossPercentage}
              onChange={(e) => onStopLossChange(Number(e.target.value))}
              className={styles.slider}
            />
          </div>

          <div className={styles.numberRuler}>
            {[0, 2, 4, 6, 8, 10].map((num) => (
              <span 
                key={num} 
                className={`${styles.numberMark} ${stopLossPercentage === num ? styles.activeNumber : ''}`}
                onClick={() => onStopLossChange(num)}
              >
                {num}
              </span>
            ))}
          </div>
        </div>

        {/* Barra de Consumo (Dano) */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <p className={styles.progressText}>
            Integridade da Banca: {progressWidth > 0 ? `-${progressWidth.toFixed(1)}%` : '100%'}
          </p>
        </div>

        {/* Valor Monetário */}
        <div className={styles.amountSection}>
          <span className={styles.amountLabel}>Valor de Proteção</span>
          <span className={styles.amountValue}>
            {stopLossPercentage > 0 ? formatCurrency(stopLossValue) : '---'}
          </span>
        </div>

        {/* Mensagem Contextual */}
        <div className={`${styles.statusMessage} ${isAnimating ? styles.messageSlide : ''}`}>
          <p className={styles.messageText}>{statusInfo.message}</p>
          <p className={styles.descriptionText}>{statusInfo.description}</p>
        </div>

      </div>
    </fieldset>
  );
});

export default StopLossCard;