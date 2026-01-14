import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa'; // Adicionei FaEye/FaEyeSlash

import { useAuth } from '../../contexts/AuthContext';
import RiskSlider from '../../components/RiskSlider';

// import logo from '../../assets/logo.png'; // REMOVIDO
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
            alert('Erro na autenticação. Verifique os dados.');
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
            console.error('Erro ao enviar email:', err);
            setResetError('Erro ao enviar email. Verifique se o endereço está correto.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.scrollContainer}>
                
                <div className={styles.loginCardWrapper}>
                    <div className={styles.form}>
                        
                        <div className={styles.header}>
                            {/* LOGO REMOVIDA DAQUI */}
                            <h1 className={styles.title}>Dealer's Access</h1>
                            <p className={styles.subtitle}>{isLogin ? 'Bem-vindo à Mesa' : 'Junte-se ao Jogo'}</p>
                        </div>

                        {error && <div className={styles.errorContainer}>{error}</div>}

                        <form style={{width: '100%'}} onSubmit={handleSubmit}>
                            {!isLogin && (
                                <div className={styles.inputGroup}>
                                    <label htmlFor="name">Nome do Jogador</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: João Silva"
                                            required
                                            minLength="2"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={styles.inputGroup}>
                                <label htmlFor="email">Email</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="password">Senha</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="******"
                                        required
                                        minLength="6"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={styles.passwordToggle}
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
                                        className={styles.forgotPassword}
                                    >
                                        Esqueceu a senha?
                                    </button>
                                )}
                            </div>

                            {!isLogin && (
                                <>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="initialBank">Banca Inicial</label>
                                        <div className={styles.inputWrapper}>
                                            <span className={styles.currencyPrefix}>R$</span>
                                            <input
                                                id="initialBank"
                                                type="text"
                                                inputMode="decimal"
                                                value={initialBank}
                                                onChange={handleInitialBankChange}
                                                placeholder="100,00"
                                                className={styles.currencyInput}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Defina seu Estilo</label>
                                        <RiskSlider value={riskValue} onValueChange={setRiskValue} />
                                    </div>
                                </>
                            )}

                            <button 
                                type="submit" 
                                className={styles.submitButton} 
                                disabled={isLoading || !validateForm()}
                            >
                                <div className={styles.goldGradient}>
                                    {isLoading ? <FaSpinner className={styles.spinner} /> : (isLogin ? 'ENTRAR NA MESA' : 'REGISTRAR JOGADA')}
                                </div>
                            </button>
                        </form>

                        <button onClick={toggleMode} className={styles.toggleButton}>
                            {isLogin ? "Novo por aqui?" : 'Já tem acesso?'}
                            <span>{isLogin ? 'Crie sua conta' : 'Faça Login'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Reset (Manteve-se igual) */}
            {showResetModal && (
                <div className={styles.modalOverlay} onClick={() => setShowResetModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={styles.closeButton}
                            onClick={() => setShowResetModal(false)}
                        >
                            <FaTimes />
                        </button>
                        
                        {resetSuccess ? (
                            <div style={{textAlign: 'center'}}>
                                <div className={styles.successIcon}><FaCheck /></div>
                                <div className={styles.modalHeader}>
                                    <h2>Email Enviado!</h2>
                                    <p>Verifique sua caixa de entrada para redefinir a senha.</p>
                                </div>
                                <button 
                                    onClick={() => setShowResetModal(false)}
                                    className={styles.submitButton}
                                >
                                    <div className={styles.goldGradient}>OK</div>
                                </button>
                            </div>
                        ) : (
                            <div style={{width: '100%'}}>
                                <div className={styles.modalHeader}>
                                    <h2>Recuperar Acesso</h2>
                                    <p>Digite seu email para receber o link de recuperação</p>
                                </div>

                                {resetError && <div className={styles.errorContainer}>{resetError}</div>}
                                
                                <form onSubmit={handleResetPassword}>
                                    <div className={styles.inputGroup}>
                                        <label>Email Cadastrado</label>
                                        <div className={styles.inputWrapper}>
                                            <input
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="seu@email.com"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        className={styles.submitButton}
                                        disabled={resetLoading}
                                    >
                                        <div className={styles.goldGradient}>
                                            {resetLoading ? <FaSpinner className={styles.spinner} /> : 'ENVIAR LINK'}
                                        </div>
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginScreen;