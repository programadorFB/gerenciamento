import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaEye, FaEyeSlash, FaCheck, FaTimes, FaLock } from 'react-icons/fa';
import { GiHearts, GiDiamonds, GiClubs, GiSpades, GiPokerHand } from 'react-icons/gi';

import { useAuth } from '../../contexts/AuthContext';
import RiskSlider from '../../components/RiskSlider';

import styles from './LoginScreen.module.css';

const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [initialBank, setInitialBank] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [riskValue, setRiskValue] = useState(5);
    
    // Estados para reset de senha
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState('');

    const { login, register, resetPassword, isLoading, error, clearError, user } = useAuth();
    const navigate = useNavigate();
    
    const shouldRedirect = useRef(false);

    useEffect(() => {
        if (user && shouldRedirect.current) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        clearError();
    }, [isLogin, clearError]);

    const validateForm = () => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
        if (!password || password.length < 6) return false;
        if (!isLogin) {
            if (!name || name.trim().length < 2) return false;
            if (!initialBank || parseFloat(initialBank.replace(',', '.')) <= 0) return false;
        }
        return true;
    };

    const formatCurrencyInput = (value) => {
        let cleaned = value.replace(/[^\d,]/g, '');
        const commaCount = cleaned.split(',').length - 1;
        if (commaCount > 1) {
            cleaned = cleaned.replace(/,+$/, '');
        }
        if (cleaned.includes(',')) {
            const parts = cleaned.split(',');
            if (parts[1].length > 2) {
                cleaned = parts[0] + ',' + parts[1].substring(0, 2);
            }
        }
        return cleaned;
    };

    const handleInitialBankChange = (e) => {
        const formattedValue = formatCurrencyInput(e.target.value);
        setInitialBank(formattedValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            alert("Por favor, preencha todos os campos corretamente.");
            return;
        }
        clearError();

        try {
            shouldRedirect.current = true;
            
            if (isLogin) {
                await login(email.trim().toLowerCase(), password);
            } else {
                const bankAmount = parseFloat(initialBank.replace(',', '.'));
                if (isNaN(bankAmount) || bankAmount <= 0) {
                    alert('Valor da banca inicial inválido.');
                    shouldRedirect.current = false;
                    return;
                }

                await register({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    initialBank: bankAmount,
                    riskValue
                });
            }
        } catch (err) {
            console.error('Erro no login/cadastro:', err);
            shouldRedirect.current = false;
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
        setName('');
        setInitialBank('');
        setRiskValue(5);
        clearError();
        shouldRedirect.current = false;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
            setResetError('Por favor, insira um email válido.');
            return;
        }
        setResetLoading(true);
        setResetError('');
        try {
            await resetPassword(resetEmail.trim().toLowerCase());
            setResetSuccess(true);
        } catch (err) {
            setResetError('Erro ao enviar email. Verifique o endereço.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundEffects}></div>
            
            <div className={styles.loginCardWrapper}>
                <div className={styles.formContent}>
                    
                    {/* Cabeçalho com Naipes Animados */}
                    <div className={styles.header}>
                        <div className={styles.suitContainer}>
                            <GiSpades className={styles.suitIcon} />
                            <GiHearts className={`${styles.suitIcon} ${styles.redSuit}`} />
                            <GiClubs className={styles.suitIcon} />
                            <GiDiamonds className={`${styles.suitIcon} ${styles.redSuit}`} />
                        </div>
                        <h1 className={styles.title}>GERENCIAMENTO DO TITÃ </h1>
                        <div className={styles.divider}>
                            <div className={styles.line}></div>
                            <span className={styles.subtitle}>{isLogin ? 'VIP ACCESS' : 'NOVO JOGADOR'}</span>
                            <div className={styles.line}></div>
                        </div>
                    </div>

                    {error && <div className={styles.errorContainer}><FaTimes /> {error}</div>}

                    <form className={styles.formBody} onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>NOME DO JOGADOR</label>
                                <input
                                    type="text"
                                    className={styles.inputField}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Como quer ser chamado?"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>EMAIL</label>
                            <input
                                type="email"
                                className={styles.inputField}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>SENHA</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={styles.inputField}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeButton}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {isLogin && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowResetModal(true);
                                        setResetSuccess(false);
                                        setResetEmail('');
                                        setResetError('');
                                    }}
                                    className={styles.forgotPasswordLink}
                                >
                                    Esqueceu a senha?
                                </button>
                            )}
                        </div>

                        {!isLogin && (
                            <>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>BANCA INICIAL</label>
                                    <div className={styles.currencyWrapper}>
                                        <span className={styles.currencySymbol}>R$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={initialBank}
                                            onChange={handleInitialBankChange}
                                            placeholder="100,00"
                                            className={styles.inputField}
                                            style={{paddingLeft: '40px'}}
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>

                                <div className={styles.sliderGroup}>
                                    <label className={styles.inputLabel}>ESTILO DE JOGO</label>
                                    <div className={styles.sliderWrapper}>
                                        <RiskSlider value={riskValue} onValueChange={setRiskValue} compact={true} />
                                    </div>
                                </div>
                            </>
                        )}

                        <button 
                            type="submit" 
                            className={styles.submitButton} 
                            disabled={isLoading}
                        >
                            {isLoading ? <FaSpinner className={styles.spinner} /> : (isLogin ? 'ENTRAR NA MESA' : 'CRIAR CONTA')}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <p>{isLogin ? "Não tem ficha?" : "Já está no jogo?"}</p>
                        <button onClick={toggleMode} className={styles.toggleButton}>
                            {isLogin ? 'CADASTRE-SE' : 'FAÇA LOGIN'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Reset (Estilo Black/Gold) */}
            {showResetModal && (
                <div className={styles.modalOverlay} onClick={() => setShowResetModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowResetModal(false)}>
                            <FaTimes />
                        </button>
                        
                        <div className={styles.modalHeader}>
                            <FaLock size={24} color="#D4AF37" />
                            <h2>RECUPERAR ACESSO</h2>
                        </div>

                        {resetSuccess ? (
                            <div className={styles.successMessage}>
                                <FaCheck size={40} />
                                <p>Link enviado para seu email!</p>
                                <button onClick={() => setShowResetModal(false)} className={styles.modalButton}>
                                    OK
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword} className={styles.modalForm}>
                                <p className={styles.modalText}>Informe seu email para receber o link de redefinição.</p>
                                
                                <input
                                    type="email"
                                    className={styles.modalInput}
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    autoFocus
                                />
                                {resetError && <p className={styles.modalError}>{resetError}</p>}

                                <button type="submit" className={styles.modalButton} disabled={resetLoading}>
                                    {resetLoading ? <FaSpinner className={styles.spinner} /> : 'ENVIAR LINK'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginScreen;