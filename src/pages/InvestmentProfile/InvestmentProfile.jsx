import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdClose, MdArrowBack } from 'react-icons/md';
import { FaSave, FaSpinner, FaCheck } from 'react-icons/fa';
// Ícones
import { GiSecurityGate, GiScales, GiFireRay } from 'react-icons/gi';

import StopLossCard from '../../components/StopLossCard';
import { useBetting } from '../../contexts/BettingContext';
import { useFinancial } from '../../contexts/FinancialContext';
import styles from './InvestmentProfile.module.css';

// --- Modal de Edição (Mantido) ---
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
                    <h3 className={styles.headerTitle}>Ajustar Defesa</h3>
                    <button onClick={onClose} className={styles.modalCloseButton}><MdClose /></button>
                </div>
                <div className={styles.modalContent}>
                    <label className={styles.inputLabel}>Porcentagem de Stop Loss</label>
                    <input
                        type="number"
                        className={styles.modalInput}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ex: 5"
                        autoFocus
                    />
                    {error && <p className={styles.errorText}>{error}</p>}
                </div>
                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
                    <button className={styles.saveButton} onClick={handleSave}>Salvar</button>
                </div>
            </div>
        </div>
    );
});

// --- COMPONENTE: VISUAL DE ROLETA ---
const RouletteDisplay = React.memo(({ selectedProfile, riskValue }) => {
    
    const visualData = useMemo(() => {
        if (riskValue >= 8) {
            return { 
                icon: GiFireRay, 
                color: '#8B0000', 
                glow: '0 0 40px rgba(139, 0, 0, 0.5)',
                label: 'AGRESSIVO'
            }; 
        } else if (riskValue >= 4) {
            return { 
                icon: GiScales, 
                color: '#D4AF37',
                glow: '0 0 40px rgba(212, 175, 55, 0.3)',
                label: 'MODERADO'
            }; 
        } else {
            return { 
                icon: GiSecurityGate, 
                color: '#2E7D32',
                glow: '0 0 40px rgba(46, 125, 50, 0.4)',
                label: 'CONSERVADOR'
            }; 
        }
    }, [riskValue]);

    const CenterIcon = visualData.icon;
    const rotationDegree = riskValue * 36; 

    return (
        <div className={styles.rouletteStage}>
            {/* O Aro da Roleta */}
            <div className={styles.rouletteContainer}>
                <div 
                    className={styles.rouletteWheel}
                    style={{ transform: `rotate(-${rotationDegree}deg)` }}
                >
                    <div className={styles.wheelInnerDetail}></div>
                </div>

                <div className={styles.roulettePointer}></div>

                <div className={styles.rouletteHub} style={{ boxShadow: visualData.glow }}>
                    <div className={styles.hubContent} style={{ color: visualData.color }}>
                        <CenterIcon size={32} />
                        <span className={styles.hubNumber}>{riskValue}</span>
                    </div>
                </div>
            </div>

            {/* Painel de Informações */}
            <div className={styles.profileInfoPanel}>
                <div className={styles.panelHeader} style={{ borderColor: visualData.color }}>
                    <span className={styles.panelLabel} style={{ color: visualData.color }}>
                        {visualData.label}
                    </span>
                    <h2 className={styles.panelTitle}>{selectedProfile.title}</h2>
                </div>
                
                <p className={styles.panelDescription}>{selectedProfile.description}</p>

                <div className={styles.featuresGrid}>
                    {selectedProfile.features.map((feature, index) => (
                        <div key={index} className={styles.featureChip} style={{ borderColor: visualData.color }}>
                            <FaCheck size={10} color={visualData.color} />
                            <span>{feature}</span>
                        </div>
                    ))}
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
            <div className={styles.loadingContainer}>
                <FaSpinner className={styles.loadingSpinner} />
                <span>Carregando mesa...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => navigate(-1)} disabled={isSaving}>
                    <MdArrowBack size={20} />
                </button>
                <span className={styles.headerTitle}>Mesa de Estratégia</span>
                <div className={styles.headerRight} />
            </header>

            <main className={styles.scrollView}>
                <div className={styles.introSection}>
                    <h1 className={styles.pageTitle}>Defina seu perfil de risco</h1>
                    <p className={styles.pageSubtitle}>Ajuste a roleta para definir seu multiplicador de risco.</p>
                </div>

                {/* Grid Principal para Layout Responsivo */}
                <div className={styles.mainContentGrid}>
                    
                    {/* Coluna Esquerda: Roleta */}
                    <div className={styles.leftColumn}>
                        <RouletteDisplay selectedProfile={selectedProfile} riskValue={riskValue} />
                    </div>

                    {/* Coluna Direita: Controles */}
                    <div className={styles.rightColumn}>
                        <div className={styles.controlsSection}>
                            
                            {/* Slider */}
                            <div className={styles.sliderControlContainer}>
                                <div className={styles.sliderTrackLabels}>
                                    <span>Seguro (1)</span>
                                    <span>Risco (10)</span>
                                </div>
                                <div className={styles.sliderWrapper}>
                                    <div className={styles.sliderRail} />
                                    <div 
                                        className={styles.sliderFill} 
                                        style={{ width: `${(riskValue / 10) * 100}%` }} 
                                    />
                                    <input 
                                        type="range" 
                                        className={styles.sliderInput}
                                        min="1" 
                                        max="10" 
                                        value={riskValue}
                                        onChange={(e) => setRiskValue(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Stop Loss */}
                            <div className={styles.stopLossSection}>
                                <StopLossCard
                                    balance={balance}
                                    initialBalance={initialBank || balance}
                                    stopLossPercentage={stopLossPercentage}
                                    onStopLossChange={setStopLossPercentage}
                                    formatCurrency={(v) => `R$ ${v}`}
                                    onEdit={() => setStopLossModalVisible(true)}
                                />
                            </div>

                            {/* Botão */}
                            <button 
                                className={styles.mainSaveButton} 
                                onClick={handleSaveProfile} 
                                disabled={isSaving}
                            >
                                {isSaving ? <FaSpinner className={styles.spinner} /> : 'SALVAR PERFIL'}
                            </button>

                        </div>
                    </div>
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