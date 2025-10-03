import React, { useMemo } from 'react';
import { 
  MdWarning, 
  MdErrorOutline, 
  MdInfo, 
  MdCheckCircle, 
  MdHelpOutline, 
  MdEdit 
} from 'react-icons/md';
import styles from './StopLossCard.module.css';

const StopLossCard = React.memo(({
  balance,
  initialBalance,
  onEdit,
  formatCurrency,
  stopLossPercentage = 0 // Recebe a prop para consistência
}) => {
  // Garantir que os valores sejam números
  const validInitialBalance = Number(initialBalance) || 0;
  const validBalance = Number(balance) || 0;

  // Cálculo DIRETO do valor do stop loss
  const stopLossValue = useMemo(() => {
    if (!validInitialBalance || !stopLossPercentage) return 0;
    return validInitialBalance * (stopLossPercentage / 100);
  }, [validInitialBalance, stopLossPercentage]);

  // Calcular perda atual (banca inicial - saldo atual)
  // ESTA É A CONEXÃO PRINCIPAL:
  // Quando a prop 'balance' muda após uma perda, este valor é recalculado.
  const currentLoss = useMemo(() => {
    if (!validInitialBalance) return 0;
    const loss = validInitialBalance - validBalance;
    return Math.max(0, loss); // Não permite valor negativo
  }, [validInitialBalance, validBalance]);

  // Calcular porcentagem de perda atual
  const currentLossPercentage = useMemo(() => {
    if (!validInitialBalance || validInitialBalance <= 0) return 0;
    return (currentLoss / validInitialBalance) * 100;
  }, [currentLoss, validInitialBalance]);

  // Verificar status do stop loss
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
          color: '#F44336', 
          icon: <MdWarning />, 
          title: 'STOP LOSS ATINGIDO!', 
          message: `Limite de ${stopLossPercentage}% foi ultrapassado (${currentLossPercentage.toFixed(1)}%)`,
          description: 'Pare imediatamente as apostas!'
        };
      case 'high':
        return { 
          color: '#FF9800', 
          icon: <MdErrorOutline />, 
          title: 'RISCO ALTO', 
          message: `Muito próximo do limite (${currentLossPercentage.toFixed(1)}% de ${stopLossPercentage}%)`,
          description: 'Considere parar ou reduzir apostas'
        };
      case 'medium':
        return { 
          color: '#FFD700', 
          icon: <MdInfo />, 
          title: 'ATENÇÃO', 
          message: `Monitorar perdas (${currentLossPercentage.toFixed(1)}% de ${stopLossPercentage}%)`,
          description: 'Mantenha-se atento aos seus limites'
        };
      case 'low':
        return { 
          color: '#4CAF50', 
          icon: <MdCheckCircle />, 
          title: 'SEGURO', 
          message: `Dentro do limite estabelecido (${currentLossPercentage.toFixed(1)}% de ${stopLossPercentage}%)`,
          description: 'Continue gerenciando seu bankroll'
        };
      default:
        return { 
          color: '#9E9E9E', 
          icon: <MdHelpOutline />, 
          title: 'NÃO DEFINIDO', 
          message: 'Configure seu stop loss para proteção',
          description: 'Clique em editar para configurar'
        };
    }
  };

  const statusInfo = useMemo(() => getStatusInfo(), [
    stopLossPercentage, 
    currentLossPercentage,
    currentLoss,
    stopLossValue
  ]);

  // Calcular progresso da barra
  const progressWidth = useMemo(() => {
    if (stopLossPercentage <= 0 || stopLossValue <= 0) return 0;
    const progress = Math.min((currentLoss / stopLossValue) * 100, 100);
    return progress;
  }, [currentLoss, stopLossValue, stopLossPercentage]);

  const cardStyle = {
    '--status-color': statusInfo.color
  };

  return (
    <div className={styles.container} style={cardStyle}>
      <div className={styles.gradient}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper} style={{ color: statusInfo.color }}>
              {statusInfo.icon}
            </div>
            <div className={styles.headerText}>
              <h3 className={styles.title} style={{ color: statusInfo.color }}>
                {statusInfo.title}
              </h3>
              <p className={styles.subtitle}>Stop Loss</p>
            </div>
          </div>
          <button className={styles.editButton} onClick={onEdit} title="Editar Stop Loss">
            <MdEdit />
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.percentageSection}>
            <div className={styles.percentageItem}>
              <span className={styles.percentageLabel}>Limite configurado</span>
              <span className={styles.percentageValue}>
                {stopLossPercentage > 0 ? `${stopLossPercentage.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className={styles.percentageItem}>
              <span className={styles.percentageLabel}>Perda atual</span>
              <span className={styles.percentageValue}>
                {currentLossPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {stopLossPercentage > 0 && (
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ 
                    width: `${progressWidth}%`,
                    backgroundColor: statusInfo.color
                  }}
                />
              </div>
              <p className={styles.progressText}>
                {currentLoss >= stopLossValue ? (
                  <span style={{ color: '#F44336', fontWeight: 'bold' }}>
                    ⚠️ Limite de perda ultrapassado!
                  </span>
                ) : (
                  `💰 Restam ${formatCurrency(Math.max(0, stopLossValue - currentLoss))} até o limite`
                )}
              </p>
            </div>
          )}

          <div className={styles.amountSection}>
            <div className={styles.amountItem}>
              <span className={styles.amountLabel}>Valor Limite de Perda</span>
              <span className={styles.amountValue}>
                {stopLossPercentage > 0 ? formatCurrency(stopLossValue) : 'N/A'}
              </span>
            </div>
            <div className={styles.amountItem}>
              <span className={styles.amountLabel}>Perda Atual</span>
              <span className={styles.amountValue}>
                {formatCurrency(currentLoss)}
              </span>
            </div>
            <div className={styles.amountItem}>
              <span className={styles.amountLabel}>Saldo Atual</span>
              <span className={styles.amountValue}>
                {formatCurrency(validBalance)}
              </span>
            </div>
            <div className={styles.amountItem}>
              <span className={styles.amountLabel}>Banca Inicial</span>
              <span className={styles.amountValue}>
                {formatCurrency(validInitialBalance)}
              </span>
            </div>
          </div>

          <div className={styles.statusMessage}>
            <p className={styles.messageText}>{statusInfo.message}</p>
            <p className={styles.descriptionText}>{statusInfo.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

StopLossCard.displayName = 'StopLossCard';

export default StopLossCard;