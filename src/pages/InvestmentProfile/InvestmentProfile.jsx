import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdClose, MdArrowBack, MdCheckCircle } from 'react-icons/md';
import { FaShieldAlt, FaSave, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import StopLossCard from '../../components/StopLossCard';
import { useBetting } from '../../contexts/BettingContext';
import { useFinancial } from '../../contexts/FinancialContext';
import styles from './InvestmentProfile.module.css';

// Componente Modal separado para melhor performance
const StopLossEditModal = React.memo(({ visible, onClose, onSave, currentPercentage = 0 }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setInputValue(currentPercentage.toString());
            setError('');
        }
    }, [visible, currentPercentage]);

    const validateInput = useCallback((value) => {
        const numericValue = parseFloat(value.replace(',', '.'));
        
        if (isNaN(numericValue) || numericValue < 0) {
            return 'Por favor, insira um valor válido';
        }
        if (numericValue >= 100) {
            return 'A porcentagem deve ser menor que 100%';
        }
        if (numericValue === 0) {
            return 'O stop loss não pode ser 0%';
        }
        return '';
    }, []);

    const handleSave = useCallback(() => {
        const errorMsg = validateInput(inputValue);
        if (errorMsg) {
            setError(errorMsg);
            return;
        }
        
        const numericValue = parseFloat(inputValue.replace(',', '.'));
        onSave(numericValue);
        onClose();
    }, [inputValue, validateInput, onSave, onClose]);

    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        // Permite apenas números, ponto e vírgula
        if (/^[0-9,.]*$/.test(value)) {
            setInputValue(value);
            // Validação em tempo real
            if (value) {
                setError(validateInput(value));
            } else {
                setError('');
            }
        }
    }, [validateInput]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    }, [handleSave]);

    if (!visible) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Editar Stop Loss</h3>
                    <button onClick={onClose} className={styles.modalCloseButton}>
                        <MdClose size={24} />
                    </button>
                </div>
                <div className={styles.modalContent}>
                    <label className={styles.inputLabel}>Porcentagem de perda máxima (%)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        className={`${styles.modalInput} ${error ? styles.inputError : ''}`}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="ex: 10"
                        autoFocus
                    />
                    {error && <p className={styles.errorText}>{error}</p>}
                    <div className={styles.percentageTips}>
                        <p className={styles.tipTitle}>Recomendações:</p>
                        <div className={styles.tipItem}>• <strong>Conservador:</strong> 5-15%</div>
                        <div className={styles.tipItem}>• <strong>Moderado:</strong> 15-25%</div>
                        <div className={styles.tipItem}>• <strong>Agressivo:</strong> 25-40%</div>
                    </div>
                </div>
                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancelar
                    </button>
                    <button 
                        className={styles.saveButton} 
                        onClick={handleSave}
                        disabled={!!error}
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
});

// Componente Slider otimizado
const RiskSlider = React.memo(({ value, onValueChange, selectedProfile }) => {
    const handleSliderChange = useCallback((event) => {
        onValueChange(Number(event.target.value));
    }, [onValueChange]);

    const progress = useMemo(() => (value / 10) * 100, [value]);
    const trackColor = selectedProfile?.color || '#666';

    const getRiskDescription = useCallback(() => {
        if (value <= 3) return 'Baixo Risco - Preservação de Capital';
        if (value <= 6) return 'Risco Moderado - Crescimento Balanceado';
        return 'Alto Risco - Busca por Retornos Máximos';
    }, [value]);

    return (
        <div className={styles.sliderComponent}>
            <div className={styles.sliderHeader}>
                <h3 className={styles.sliderTitle}>Nível de Tolerância ao Risco</h3>
                <div className={styles.currentProfileIndicator}>
                    <FaShieldAlt style={{ color: trackColor }} />
                    <span style={{ color: trackColor }}>{selectedProfile?.title}</span>
                </div>
            </div>
            
            <div className={styles.riskDescription}>
                <p>{getRiskDescription()}</p>
            </div>

            <div className={styles.sliderWrapper}>
                <div className={styles.floatingIcon} style={{ left: `calc(${progress}% - 25px)` }}>
                    <div className={styles.iconBubble} style={{ borderColor: trackColor }}>
                        <span>{value}</span>
                    </div>
                    <div className={styles.iconArrow} style={{ borderTopColor: trackColor }} />
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={value}
                    onChange={handleSliderChange}
                    className={styles.sliderInput}
                    style={{ 
                        '--progress': `${progress}%`, 
                        '--track-color': trackColor 
                    }}
                />
            </div>
            <div className={styles.sliderLabels}>
                <span>
                    <div className={styles.labelMarker} style={{ backgroundColor: '#4CAF50' }} />
                    Cauteloso
                </span>
                <span>
                    <div className={styles.labelMarker} style={{ backgroundColor: '#FFD700' }} />
                    Equilibrado
                </span>
                <span>
                    <div className={styles.labelMarker} style={{ backgroundColor: '#F44336' }} />
                    Alto Risco
                </span>
            </div>
        </div>
    );
});

// Componente de exibição do perfil
const ProfileDisplay = React.memo(({ selectedProfile, riskValue, stopLossPercentage, initialBank }) => {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        if (selectedProfile) {
            setIsMounted(false);
            const timer = setTimeout(() => setIsMounted(true), 50);
            return () => clearTimeout(timer);
        }
    }, [selectedProfile]);

    const calculateStopLossAmount = useCallback(() => {
        if (!initialBank || stopLossPercentage <= 0) return 0;
        return initialBank * (stopLossPercentage / 100);
    }, [initialBank, stopLossPercentage]);

    if (!selectedProfile) return null;

    return (
        <div 
            className={`${styles.profileDisplay} ${isMounted ? styles.profileDisplayVisible : ''}`} 
            style={{ '--profile-color': selectedProfile.color }}
        >
            <div className={styles.profileHeader}>
                <div className={styles.rouletteWheel}>
                    <div className={styles.rouletteCenter}>
                        <span className={styles.rouletteNumber}>{riskValue}</span>
                    </div>
                </div>
                <div className={styles.profileText}>
                    <h3 className={styles.profileTitle}>{selectedProfile.title}</h3>
                    <p className={styles.profileDescription}>{selectedProfile.description}</p>
                </div>
            </div>
            
            <div className={styles.featuresContainer}>
                <h4 className={styles.featuresTitle}>Características do Perfil:</h4>
                {selectedProfile.features.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                        <MdCheckCircle size={16} style={{ color: selectedProfile.color }} />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <div className={styles.currentSettings}>
                <h4 className={styles.settingsTitle}>Configurações Atuais:</h4>
                <div className={styles.settingItem}>
                    <strong>Stop Loss:</strong> 
                    <span className={styles.settingValue}>{stopLossPercentage}%</span>
                </div>
                <div className={styles.settingItem}>
                    <strong>Valor Limite:</strong> 
                    <span className={styles.settingValue}>
                        R$ {calculateStopLossAmount().toFixed(2)}
                    </span>
                </div>
                <div className={styles.settingItem}>
                    <strong>Meta de Lucro:</strong> 
                    <span className={styles.settingValue}>{selectedProfile.recommendedProfitTarget}%</span>
                </div>
            </div>
        </div>
    );
});

// Componente principal
const InvestmentProfile = () => {
    const navigate = useNavigate();
    const { 
        bettingProfile, 
        saveCompleteProfile, 
        isLoading: isBettingLoading,
        getProfileDetailsByRisk 
    } = useBetting();
    
    const { balance, initialBank } = useFinancial();
    
    const effectiveInitialBank = useMemo(() => {
        return initialBank > 0 ? initialBank : balance;
    }, [initialBank, balance]);

    // Estados locais com valores padrão
    const [riskValue, setRiskValue] = useState(5);
    const [stopLossPercentage, setStopLossPercentage] = useState(0);
    const [isStopLossModalVisible, setStopLossModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    // Inicializar estados quando o perfil carregar
    useEffect(() => {
        if (bettingProfile?.isInitialized) {
            const currentRisk = bettingProfile.riskLevel || 5;
            const currentProfile = getProfileDetailsByRisk(currentRisk);
            
            setRiskValue(currentRisk);
            setStopLossPercentage(
                bettingProfile.stopLossPercentage || currentProfile.recommendedStopLoss
            );
        }
    }, [bettingProfile, getProfileDetailsByRisk]);

    const selectedProfile = useMemo(() => 
        getProfileDetailsByRisk(riskValue), 
    [getProfileDetailsByRisk, riskValue]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(amount || 0);
    }, []);

    const handleSaveStopLoss = useCallback((percentage) => {
        setStopLossPercentage(percentage);
        setSaveStatus(`Stop Loss atualizado para ${percentage}% - Salve o perfil para aplicar`);
        const timer = setTimeout(() => setSaveStatus(''), 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleSaveProfile = useCallback(async () => {
        if (!selectedProfile || stopLossPercentage <= 0) {
            setSaveStatus('Erro: Configure um perfil e stop loss válidos');
            return;
        }

        setIsSaving(true);
        setSaveStatus('Salvando perfil completo...');
        
        try {
            const completeProfileData = {
                profile: {
                    id: selectedProfile.id,
                    title: selectedProfile.title,
                    description: selectedProfile.description,
                    features: selectedProfile.features,
                    color: selectedProfile.color,
                    icon: { name: selectedProfile.icon?.name || 'dice' },
                },
                riskLevel: riskValue,
                initialBalance: effectiveInitialBank,
                stopLossPercentage: stopLossPercentage,
                bankroll: balance,
                profitTarget: selectedProfile.recommendedProfitTarget,
            };
            
            const result = await saveCompleteProfile(completeProfileData);
            
            if (result.success) {
                setSaveStatus('✅ Perfil salvo com sucesso!');
                setTimeout(() => {
                    navigate(-1);
                }, 1500);
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            setSaveStatus('❌ Erro ao salvar perfil: ' + error.message);
            setTimeout(() => setSaveStatus(''), 5000);
        } finally {
            setIsSaving(false);
        }
    }, [
        selectedProfile, 
        riskValue, 
        stopLossPercentage, 
        balance, 
        effectiveInitialBank, 
        saveCompleteProfile, 
        navigate
    ]);

    // Loading state
    if (isBettingLoading && !bettingProfile?.isInitialized) {
        return (
            <div className={styles.loadingContainer}>
                <FaSpinner className={styles.loadingSpinner} />
                <p>Carregando perfil de apostas...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button 
                    className={styles.backButton} 
                    onClick={() => navigate(-1)}
                    disabled={isSaving}
                >
                    <MdArrowBack size={24} />
                </button>
                <h2 className={styles.headerTitle}>Perfil de Investimento</h2>
                <div className={styles.headerRight} />
            </header>

            <main className={styles.scrollView}>
                <div className={styles.introduction}>
                    <h1 className={styles.introTitle}>Defina seu Estilo de Jogo</h1>
                    <p className={styles.introDescription}>
                        Configure seu perfil de risco e proteção - todas as configurações serão salvas juntas.
                    </p>
                </div>

                <RiskSlider 
                    value={riskValue} 
                    onValueChange={setRiskValue} 
                    selectedProfile={selectedProfile} 
                />

                <ProfileDisplay 
                    selectedProfile={selectedProfile} 
                    riskValue={riskValue}
                    stopLossPercentage={stopLossPercentage}
                    initialBank={effectiveInitialBank}
                />

                <div className={styles.stopLossSection}>
                    <h3 className={styles.sectionTitle}>Gestão de Risco - Stop Loss</h3>
                    <p className={styles.sectionDescription}>
                        Configure a porcentagem máxima de perda permitida. Esta configuração será salva junto com seu perfil.
                    </p>
<StopLossCard
    balance={balance}
    initialBalance={effectiveInitialBank}
    formatCurrency={formatCurrency}
    onEdit={() => setStopLossModalVisible(true)} // Esta prop parece não ser usada no StopLossCard que você me mandou
    stopLossPercentage={stopLossPercentage}
    
    // ADICIONE ESTA LINHA:
    onStopLossChange={setStopLossPercentage} 
/>
                </div>

                {saveStatus && (
                    <div className={`${styles.statusMessage} ${
                        saveStatus.includes('Erro') ? styles.error : 
                        saveStatus.includes('sucesso') ? styles.success : styles.info
                    }`}>
                        {saveStatus.includes('Erro') && <FaExclamationTriangle />}
                        {saveStatus.includes('sucesso') && <MdCheckCircle />}
                        {saveStatus}
                    </div>
                )}

                <div className={styles.actionButtons}>
                    <button 
                        className={styles.secondaryButton}
                        onClick={() => navigate(-1)}
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button 
                        className={styles.mainSaveButton} 
                        onClick={handleSaveProfile} 
                        disabled={isSaving || !selectedProfile || stopLossPercentage <= 0}
                        style={{ 
                            '--profile-color': selectedProfile?.color,
                            opacity: (isSaving || !selectedProfile || stopLossPercentage <= 0) ? 0.6 : 1
                        }}
                    >
                        {isSaving ? (
                            <>
                                <FaSpinner className={styles.spinner} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <FaSave />
                                Salvar Perfil Completo
                            </>
                        )}
                    </button>
                </div>

                {selectedProfile && (
                    <div className={styles.riskWarning} style={{ '--profile-color': selectedProfile.color }}>
                        <FaExclamationTriangle />
                        <div className={styles.warningContent}>
                            <p>
                                {selectedProfile.id === 'highrisk'
                                    ? 'ATENÇÃO: Perfil de alto risco pode resultar em perdas significativas. Todas as configurações, incluindo stop loss, serão salvas como parte do seu perfil.'
                                    : 'Lembre-se: Configure seu stop loss adequadamente. Todas as configurações serão salvas juntas quando você clicar em "Salvar Perfil Completo".'
                                }
                            </p>
                        </div>
                    </div>
                )}
            </main>

            <StopLossEditModal
                visible={isStopLossModalVisible}
                onClose={() => setStopLossModalVisible(false)}
                onSave={handleSaveStopLoss}
                currentPercentage={stopLossPercentage}
            />
        </div>
    );
};

export default InvestmentProfile;