import React, { useMemo, useState, useEffect } from 'react';
import {
  MdShield,
  MdSecurity,
  MdWarning,
  MdGppBad,
  MdLockOutline
} from 'react-icons/md';
import styles from './StopLossCard.module.css';

const StopLossCard = React.memo(({
  balance,
  initialBalance,
  formatCurrency,
  stopLossPercentage = 0,
  onStopLossChange,
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

  // Lógica de Cores e Ícones (Tema Elite)
  // 0-3%: Esmeralda (Safe/Conservador)
  // 4-7%: Ouro (Caution/Moderado)
  // 8-10%: Sangue (Danger/Agressivo)
  const statusInfo = useMemo(() => {
    if (stopLossPercentage === 0) {
      return {
        color: '#666',
        icon: <MdLockOutline />,
        title: 'DESATIVADO',
        description: 'Sem proteção ativa.'
      };
    }
    if (stopLossPercentage <= 3) {
      return {
        color: '#2E7D32', // Esmeralda Escura
        icon: <MdShield />,
        title: 'CONSERVADOR',
        description: 'Proteção máxima de capital.'
      };
    }
    if (stopLossPercentage <= 7) {
      return {
        color: '#D4AF37', // Ouro
        icon: <MdSecurity />,
        title: 'MODERADO',
        description: 'Equilíbrio entre risco e retorno.'
      };
    }
    return {
      color: '#8B0000', // Vermelho Sangue
      icon: <MdGppBad />,
      title: 'AGRESSIVO',
      description: 'Alta exposição ao risco.'
    };
  }, [stopLossPercentage]);

  // Efeito de animação ao mudar texto
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [statusInfo.title]);

  // Porcentagem de consumo do Stop Loss
  const progressWidth = useMemo(() => {
    if (stopLossValue === 0) return 0;
    const pct = (currentLoss / stopLossValue) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }, [currentLoss, stopLossValue]);

  return (
    <div 
      className={styles.container}
      style={{ '--status-color': statusInfo.color }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            {statusInfo.icon}
          </div>
          <span className={styles.labelTitle}>Gestão de Risco</span>
        </div>
        <div className={styles.statusBadge}>
          {statusInfo.title}
        </div>
      </div>

      <div className={styles.content}>
        
        {/* Mostrador Principal (Display Digital Luxo) */}
        <div className={styles.displaySection}>
          <span className={styles.displayValue}>
            {stopLossPercentage}%
          </span>
          <span className={styles.displayLabel}>Stop Loss</span>
        </div>

        {/* Slider Físico */}
        <div className={styles.sliderSection}>
          <div className={styles.sliderTrackBackground}>
             <div className={styles.sliderTrackFill} style={{width: `${stopLossPercentage * 10}%`}}></div>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={stopLossPercentage}
            onChange={(e) => onStopLossChange(Number(e.target.value))}
            className={styles.sliderInput}
          />
          
          {/* Marcadores de Régua */}
          <div className={styles.rulerContainer}>
            {[0, 2, 4, 6, 8, 10].map((num) => (
               <div key={num} className={styles.rulerMark} onClick={() => onStopLossChange(num)}>
                 <span className={styles.rulerLine}></span>
                 <span className={styles.rulerNumber}>{num}</span>
               </div>
            ))}
          </div>
        </div>

        {/* Info Financeira e Barra de Dano */}
        <div className={styles.infoGrid}>
           <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Valor Protegido</span>
              <span className={styles.infoValue}>{stopLossPercentage > 0 ? formatCurrency(stopLossValue) : '---'}</span>
           </div>
           
           <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Integridade</span>
              <div className={styles.miniProgressBar}>
                 <div 
                    className={styles.miniProgressFill} 
                    style={{ 
                       width: `${Math.max(0, 100 - progressWidth)}%`,
                       backgroundColor: progressWidth > 90 ? '#8B0000' : 'var(--status-color)'
                    }} 
                 />
              </div>
           </div>
        </div>

        {/* Descrição Dinâmica */}
        <div className={`${styles.footerMessage} ${isAnimating ? styles.fadeEffect : ''}`}>
           {statusInfo.description}
        </div>

      </div>
    </div>
  );
});

export default StopLossCard;