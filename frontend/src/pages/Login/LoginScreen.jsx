import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff, MdClose } from 'react-icons/md'; // ⛔ Removido
// import { FaCoins, FaSignInAlt, FaUserPlus } from 'react-icons/fa'; // ⛔ Removido

import { useAuth } from '../../contexts/AuthContext';
import RiskSlider from '../../components/RiskSlider';

// import background from '../../assets/fundoLuxo.jpg'; // ⛔ Removido (Fundo agora vem do CSS)
import logo from '../../assets/logo.png'; // ✅ Mantido (Usado no .logo)
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

    const handleForgotPassword = () => {
        setShowResetModal(true);
        setResetEmail('');
        setResetSuccess(false);
        setResetError('');
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
            console.error('Erro ao enviar email de recuperação:', err);
            setResetError('Erro ao enviar email. Verifique se o email está correto.');
        } finally {
            setResetLoading(false);
        }
    };

    const closeResetModal = () => {
        setShowResetModal(false);
        setResetEmail('');
        setResetSuccess(false);
        setResetError('');
    };

    return (
        // 👇 O style inline foi removido. O .container do CSS cuida do fundo 'Bliss'.
        <div className={styles.container}> 
            <div className={styles.overlayGradient} />
            <main className={styles.scrollContainer}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <img src={logo} alt="Logo" className={styles.logo} />
                    </div>
                    <h1>Gerenciamento Premium</h1>
                    <p>{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta e defina seu perfil'}</p>
                </div>

                {error && <div className={styles.errorContainer}>{error}</div>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className={styles.inputGroup}>
                            {/* 👇 Ícone removido do label */}
                            <label htmlFor="name">Nome Completo</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Digite seu nome"
                                required
                                minLength="2"
                            />
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        {/* 👇 Ícone removido do label */}
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        {/* 👇 Ícone removido do label */}
                        <label htmlFor="password">Senha</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Pelo menos 6 caracteres"
                                required
                                minLength="6"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={styles.passwordToggle}
                            >
                                {/* 👇 Ícone substituído por texto/símbolo simples */}
                                {showPassword ? 'ABC' : '***'}
                            </button>
                        </div>
                        {isLogin && (
                            <button 
                                type="button"
                                onClick={handleForgotPassword}
                                className={styles.forgotPassword}
                            >
                                Esqueceu a senha?
                            </button>
                        )}
                    </div>

                    {!isLogin && (
                        <>
                            <div className={styles.inputGroup}>
                                {/* 👇 Ícone removido do label */}
                                <label htmlFor="initialBank">Banca Inicial</label>
                                <div className={styles.currencyInputWrapper}>
                                    <span>R$</span>
                                    <input
                                        id="initialBank"
                                        type="text"
                                        inputMode="decimal"
                                        value={initialBank}
                                        onChange={handleInitialBankChange}
                                        placeholder="100,00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Perfil de Investimento</label>
                                {/* O RiskSlider é mantido, assumindo que ele tem sua própria
                                    estilização ou que você o estilizará no padrão XP. */}
                                <RiskSlider value={riskValue} onValueChange={setRiskValue} />
                                <small className={styles.helpText}>
                                    Defina seu nível de risco para metas de lucro automáticas
                                </small>
                            </div>
                        </>
                    )}

                    <button 
                        type="submit" 
                        className={styles.submitButton} 
                        disabled={isLoading || !validateForm()}
                    >
                        <div className={styles.goldGradient}>
                            {/* 👇 Ícones removidos do botão */}
                            {isLoading
                                ? 'Carregando...'
                                : isLogin
                                    ? 'Entrar'
                                    : 'Criar Conta'}
                        </div>
                    </button>
                </form>

                <button onClick={toggleMode} className={styles.toggleButton}>
                    {isLogin ? "Não tem uma conta? " : 'Já tem uma conta? '}
                    <span>{isLogin ? 'Cadastre-se' : 'Faça Login'}</span>
                </button>
            </main>

            {/* Modal de Reset de Senha */}
            {showResetModal && (
                <div className={styles.modalOverlay} onClick={closeResetModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={styles.closeButton}
                            onClick={closeResetModal}
                        >
                            {/* 👇 Ícone substituído por um 'X' simples, estilizado pelo CSS */}
                            X
                        </button>
                        
                        <div className={styles.modalHeader}>
                            <h2>Recuperar Senha</h2>
                            <p>Digite seu email para receber o link de recuperação</p>
                        </div>

                        {resetSuccess ? (
                            <div className={styles.successMessage}>
                                <div className={styles.successIcon}>✓</div>
                                <h3>Email Enviado!</h3>
                                <p>Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
                                <button 
                                    onClick={closeResetModal}
                                    className={styles.okButton}
                                >
                                    OK
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword} className={styles.resetForm}>
                                {resetError && (
                                    <div className={styles.errorContainer}>
                                        {resetError}
                                    </div>
                                )}
                                
                                <div className={styles.inputGroup}>
                                    {/* 👇 Ícone removido do label */}
                                    <label htmlFor="resetEmail">
                                        Email
                                    </label>
                                    <input
                                        id="resetEmail"
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={resetLoading}
                                >
                                    <div className={styles.goldGradient}>
                                        {resetLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                                    </div>
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