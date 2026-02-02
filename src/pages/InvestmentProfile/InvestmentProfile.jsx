import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdClose, MdArrowBack } from 'react-icons/md';
import { FaSpinner, FaCheck } from 'react-icons/fa';

import StopLossCard from '../../components/StopLossCard';
import RiskSlider from '../../components/RiskSlider';
import { useBetting } from '../../contexts/BettingContext';
import { useFinancial } from '../../contexts/FinancialContext';
import styles from './InvestmentProfile.module.css';

// --- Modal de Edição do Stop Loss ---
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
                    <span className={styles.modalTitle}>AJUSTAR STOP LOSS</span>
                    <button className={styles.modalCloseButton} onClick={onClose}>
                        <MdClose size={20} />
                    </button>
                </div>
                <div className={styles.modalContent}>
                    <label className={styles.inputLabel}>Percentual de Risco Diário (%)</label>
                    <input
                        type="text"
                        className={styles.modalInput}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ex: 5.0"
                        autoFocus
                    />
                    {error && <p className={styles.errorText}>{error}</p>}
                    
                    <div className={styles.modalActions}>
                        <button className={styles.cancelButton} onClick={onClose}>CANCELAR</button>
                        <button className={styles.saveButton} onClick={handleSave}>CONFIRMAR</button>
                    </div>
                </div>
            </div>
        </div>
    );
});

const InvestmentProfile = () => {
    const navigate = useNavigate();
    const { bettingProfile, updateBettingProfile, isSaving } = useBetting();
    const { balance, initialBank } = useFinancial();

    const [riskValue, setRiskValue] = useState(5);
    const [stopLossPercentage, setStopLossPercentage] = useState(5);
    const [isStopLossModalVisible, setStopLossModalVisible] = useState(false);

    useEffect(() => {
        if (bettingProfile?.isInitialized) {
            const rawRisk = bettingProfile.riskLevel || 5;
            const normalizedRisk = rawRisk <= 1 && rawRisk > 0 ? rawRisk * 10 : rawRisk;
            setRiskValue(Math.min(Math.max(normalizedRisk, 1), 10));
            setStopLossPercentage(bettingProfile.stopLossPercentage || 5);
        }
    }, [bettingProfile]);

    // Lógica atualizada para salvar e navegar
    const handleSaveProfile = async () => {
        try {
            await updateBettingProfile({
                riskLevel: riskValue,
                stopLossPercentage: stopLossPercentage,
                isInitialized: true
            });
            
            // Navega para a dashboard após o sucesso do salvamento
            navigate('/dashboard'); 
            
        } catch (err) {
            console.error("Erro ao salvar perfil:", err);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => navigate(-1)}>
                    <MdArrowBack size={24} />
                </button>
                <h1 className={styles.headerTitle}>PERFIL DE INVESTIMENTO</h1>
                <div className={styles.headerRight} /> 
            </header>

            <div className={styles.scrollView}>
                <section className={styles.introSection}>
                    <h2 className={styles.pageTitle}>ESTRATÉGIA OPERACIONAL</h2>
                    <p className={styles.pageSubtitle}>Ajuste sua exposição e limites de segurança no mercado.</p>
                </section>

                <div className={styles.mainContentGrid}>
                    <div className={styles.leftColumn}>
                        <div className={styles.rouletteStage}>
                            <div className={styles.rouletteContainer}>
                                <div className={styles.roulettePointer} />
                                <div className={styles.rouletteWheel} style={{ transform: `rotate(${riskValue * 36}deg)` }}>
                                    <div className={styles.wheelInnerDetail} />
                                </div>
                                <div className={styles.rouletteHub}>
                                    <div className={styles.hubContent}>
                                        <span className={styles.hubNumber}>{riskValue}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.profileInfoPanel}>
                                <span className={styles.panelLabel}>CONFIGURAÇÃO ATUAL</span>
                                <p className={styles.panelDescription}>
                                    O seu nível de risco {riskValue}/10 define a agressividade da roleta.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.controlsSection}>
                        <div className={styles.sliderControlContainer}>
                            <div className={styles.sliderTrackLabels}>
                                <span>Conservador</span>
                                <span>Agressivo</span>
                            </div>
                            
                            <RiskSlider 
                                value={riskValue}
                                onValueChange={setRiskValue}
                                min={1}
                                max={10}
                            />
                        </div>

                        <div className={styles.stopLossSection}>
                            <StopLossCard
                                balance={balance}
                                initialBalance={initialBank || balance}
                                stopLossPercentage={stopLossPercentage}
                                onStopLossChange={setStopLossPercentage}
                                formatCurrency={(v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                onEdit={() => setStopLossModalVisible(true)}
                            />
                        </div>

                        <button 
                            className={styles.mainSaveButton} 
                            onClick={handleSaveProfile} 
                            disabled={isSaving}
                        >
                            {isSaving ? <FaSpinner className={styles.spinner} /> : (
                                <>
                                    <FaCheck style={{ marginRight: 10 }} />
                                    SALVAR PERFIL
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

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