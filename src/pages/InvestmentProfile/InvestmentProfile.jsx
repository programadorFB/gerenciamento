import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdClose, MdArrowBack } from 'react-icons/md';
import { FaSave, FaSpinner, FaCheck, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
// Importando naipes para o visual de carta
import { GiDiamonds, GiHearts, GiSpades, GiClubs } from 'react-icons/gi';
import StopLossCard from '../../components/StopLossCard';
import { useBetting } from '../../contexts/BettingContext';
import { useFinancial } from '../../contexts/FinancialContext';
import styles from './InvestmentProfile.module.css';

// Modal de Edição da Defesa (Mantido funcional)
const StopLossEditModal = React.memo(({ visible, onClose, onSave, currentPercentage = 0 }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setInputValue(currentPercentage.toString());
            setError('');
        }
    }, [visible, currentPercentage]);

    const handleSave = () => {
        const val = parseFloat(inputValue.replace(',', '.'));
        if (isNaN(val) || val < 0 || val > 10) {
            setError('Digite um valor entre 0 e 10');
            return;
        }
        onSave(val);
        onClose();
    };

    if (!visible) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.headerTitle} style={{fontSize: '14px'}}>Ajustar Defesa</h3>
                    <button onClick={onClose} className={styles.backButton} style={{border: 'none'}}>
                        <MdClose size={20} />
                    </button>
                </div>
                <div style={{padding: '20px'}}>
                    <input
                        type="number"
                        className={styles.sliderInput} // Reutilizando estilo de input
                        style={{height: '40px', padding: '10px', color: '#FFF'}}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ex: 5"
                        autoFocus
                    />
                    {error && <p style={{color: '#FF4444', fontSize: '12px', marginTop: '5px'}}>{error}</p>}
                    <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                        <button className={styles.secondaryButton} onClick={onClose} style={{flex: 1}}>Cancelar</button>
                        <button className={styles.mainButton} onClick={handleSave} style={{flex: 1}}>Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Componente Visual da Carta
const PlayingCardDisplay = React.memo(({ selectedProfile, riskValue }) => {
    
    const cardVisuals = useMemo(() => {
        if (riskValue >= 8) {
            return { Icon: GiHearts, color: '#FF4444', suitName: 'Hearts' }; 
        } else if (riskValue >= 5) {
            return { Icon: GiDiamonds, color: '#D4AF37', suitName: 'Diamonds' }; 
        } else if (riskValue >= 3) {
            return { Icon: GiClubs, color: '#00C853', suitName: 'Clubs' }; 
        } else {
            return { Icon: GiSpades, color: '#2979FF', suitName: 'Spades' }; 
        }
    }, [riskValue]);

    if (!selectedProfile) return null;

    const SuitIcon = cardVisuals.Icon;

    return (
        <div className={styles.cardContainerPerspective}>
            <div 
                className={styles.profileDisplay}
                style={{ '--card-color': cardVisuals.color }}
            >
                <div className={styles.cardInnerArt}>
                    
                    {/* Índices */}
                    <div className={styles.cardCornerTop}>
                        <span className={styles.cardRank}>{riskValue}</span>
                        <span className={styles.cardSuit}><SuitIcon /></span>
                    </div>
                    <div className={styles.cardCornerBottom}>
                        <span className={styles.cardRank}>{riskValue}</span>
                        <span className={styles.cardSuit}><SuitIcon /></span>
                    </div>

                    {/* Conteúdo Central */}
                    <div className={styles.cardCenterContent}>
                        
                        {/* 1. Medidor (Esquerda no desktop, Topo no mobile) */}
                        <div className={styles.gaugeWrapper}>
                            <div className={styles.gaugeDiamond}></div>
                            <span className={styles.gaugeNumber}>{riskValue}</span>
                        </div>

                        {/* 2. Informações (Direita no desktop, Baixo no mobile) */}
                        <div className={styles.cardInfo}>
                            <h2 className={styles.cardTitle}>{selectedProfile.title}</h2>
                            <p className={styles.cardDescription}>{selectedProfile.description}</p>

                            <div className={styles.featuresList}>
                                {selectedProfile.features.map((feature, index) => (
                                    <div key={index} className={styles.featureRow}>
                                        <FaCheck size={10} color={cardVisuals.color} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}); 
const InvestmentProfile = () => {
    const navigate = useNavigate();
    const { 
        bettingProfile, 
        saveCompleteProfile, 
        isLoading: isBettingLoading,
        getProfileDetailsByRisk 
    } = useBetting();
    
    const { balance, initialBank } = useFinancial();
    
    const [riskValue, setRiskValue] = useState(5);
    const [stopLossPercentage, setStopLossPercentage] = useState(0);
    const [isStopLossModalVisible, setStopLossModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Inicialização
    useEffect(() => {
        if (bettingProfile?.isInitialized) {
            const currentRisk = bettingProfile.riskLevel || 5;
            setRiskValue(currentRisk);
            const stopLoss = bettingProfile.stopLossPercentage || 5;
            setStopLossPercentage(Math.min(Math.max(stopLoss, 0), 10));
        }
    }, [bettingProfile]);

    const selectedProfile = useMemo(() => getProfileDetailsByRisk(riskValue), [getProfileDetailsByRisk, riskValue]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const completeData = {
                riskLevel: riskValue,
                stopLossPercentage,
                initialBalance: initialBank || balance,
                bankroll: balance,
                profile: selectedProfile
            };
            await saveCompleteProfile(completeData);
            navigate(-1);
        } catch (error) {
            console.error("Erro ao salvar", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isBettingLoading && !bettingProfile?.isInitialized) {
        return (
            <div className={styles.container} style={{justifyContent: 'center', alignItems: 'center'}}>
                <FaSpinner className={styles.spinner} size={40} color="#D4AF37" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => navigate(-1)} disabled={isSaving}>
                    <MdArrowBack size={20} />
                </button>
                <span className={styles.headerTitle}>Genrenciamento Tipster Black</span>
                <div className={styles.headerRight} />
            </header>

            <main className={styles.scrollView}>
                <div className={styles.introduction}>
                    <h1 className={styles.introTitle}>Sua Carta</h1>
                    <p className={styles.introDescription}>Defina o peso da sua mão na mesa.</p>
                </div>

                {/* Controle Deslizante */}
                <div className={styles.sliderControl}>
                    <div className={styles.sliderLabel}>
                        <span>Defesa (1)</span>
                        <span>Ataque (10)</span>
                    </div>
                    <input 
                        type="range" 
                        className={styles.sliderInput}
                        min="1" 
                        max="10" 
                        value={riskValue}
                        onChange={(e) => setRiskValue(parseInt(e.target.value))}
                    />
                </div>

                {/* A Carta Principal */}
                <PlayingCardDisplay selectedProfile={selectedProfile} riskValue={riskValue} />

                {/* Stop Loss (Container Ajustado) */}
                <div className={styles.stopLossContainer}>
                    <StopLossCard
                        balance={balance}
                        initialBalance={initialBank || balance}
                        stopLossPercentage={stopLossPercentage}
                        onStopLossChange={setStopLossPercentage}
                        formatCurrency={(v) => `R$ ${v}`}
                        onEdit={() => setStopLossModalVisible(true)}
                    />
                </div>

                {/* Botões de Ação */}
                <div className={styles.actionButtons}>
                    <button 
                        className={styles.mainButton} 
                        onClick={handleSaveProfile} 
                        disabled={isSaving}
                    >
                        {isSaving ? <FaSpinner className={styles.spinner} /> : 'CONFIRMAR MÃO'}
                    </button>
                    <button className={styles.secondaryButton} onClick={() => navigate(-1)} disabled={isSaving}>
                        SAIR DA MESA
                    </button>
                </div>
            </main>

            <StopLossEditModal
                visible={isStopLossModalVisible}
                onClose={() => setStopLossModalVisible(false)}
                onSave={setStopLossPercentage}
                currentPercentage={stopLossPercentage}
            />
        </div>
    );
};

export default InvestmentProfile;