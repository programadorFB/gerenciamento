import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { FaCoins, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

import { useAuth } from '../../contexts/AuthContext';
import RiskSlider from '../../components/RiskSlider';

import background from '../../assets/fundoLuxo.jpg';
import logo from '../../assets/logo.png';
import styles from './LoginScreen.module.css';

const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [initialBank, setInitialBank] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [riskValue, setRiskValue] = useState(5);

    const { login, register, isLoading, error, clearError, user } = useAuth();
    const navigate = useNavigate();

    // ✅ Quando user mudar (autenticado), redireciona automaticamente
    useEffect(() => {
        if (user) navigate('/dashboard');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            alert("Por favor, preencha todos os campos corretamente.");
            return;
        }
        clearError();

        try {
            if (isLogin) {
                await login(email.trim().toLowerCase(), password);
            } else {
                const bankAmount = Number(parseFloat(initialBank.replace(',', '.')).toFixed(2));
                await register({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    initialBank: bankAmount,
                    riskValue
                });
            }
            // ❌ NÃO usamos navigate aqui — o redirecionamento é feito no useEffect acima
        } catch (err) {
            console.error('Erro no login/cadastro:', err);
            alert('Erro na autenticação. Verifique os dados.');
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
        setName('');
        setInitialBank('');
    };

    return (
        <div className={styles.container} style={{ backgroundImage: `url(${background})` }}>
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
                            <label htmlFor="name"><MdPerson /> Nome Completo</label>
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
                        <label htmlFor="email"><MdEmail /> Email</label>
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
                        <label htmlFor="password"><MdLock /> Senha</label>
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
                                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <>
                            <div className={styles.inputGroup}>
                                <label htmlFor="initialBank"><FaCoins /> Banca Inicial</label>
                                <div className={styles.currencyInputWrapper}>
                                    <span>R$</span>
                                    <input
                                        id="initialBank"
                                        type="text"
                                        inputMode="decimal"
                                        value={initialBank}
                                        onChange={(e) => setInitialBank(e.target.value)}
                                        placeholder="100,00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Perfil de Investimento</label>
                                <RiskSlider value={riskValue} onValueChange={setRiskValue} />
                            </div>
                        </>
                    )}

                    <button type="submit" className={styles.submitButton} disabled={isLoading}>
                        <div className={styles.goldGradient}>
                            {isLoading
                                ? 'Carregando...'
                                : isLogin
                                    ? <><FaSignInAlt /> Entrar</>
                                    : <><FaUserPlus /> Criar Conta</>}
                        </div>
                    </button>
                </form>

                <button onClick={toggleMode} className={styles.toggleButton}>
                    {isLogin ? "Não tem uma conta? " : 'Já tem uma conta? '}
                    <span>{isLogin ? 'Cadastre-se' : 'Faça Login'}</span>
                </button>
            </main>
        </div>
    );
};

export default LoginScreen;
