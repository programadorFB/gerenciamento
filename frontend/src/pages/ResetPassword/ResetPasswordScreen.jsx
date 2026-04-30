import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import logo from '../../assets/logo.png';
import styles from '../Login/LoginScreen.module.css';

const ResetPasswordScreen = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { confirmResetPassword } = useAuth();

    const token = searchParams.get('token') || '';

    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [tokenError, setTokenError] = useState('');
    const [tokenEmail, setTokenEmail] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const verify = async () => {
            if (!token) {
                setTokenError('Link inválido. Token ausente.');
                setVerifying(false);
                return;
            }
            try {
                const resp = await apiService.verifyResetToken(token);
                if (cancelled) return;
                if (resp && resp.success) {
                    setTokenValid(true);
                    setTokenEmail(resp.email || '');
                } else {
                    setTokenError(resp?.error || 'Token inválido ou expirado.');
                }
            } catch (err) {
                if (cancelled) return;
                setTokenError(err?.message || 'Token inválido ou expirado.');
            } finally {
                if (!cancelled) setVerifying(false);
            }
        };
        verify();
        return () => { cancelled = true; };
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }
        setSubmitting(true);
        try {
            await confirmResetPassword(token, password);
            setSuccess(true);
        } catch (err) {
            setError(err?.message || 'Erro ao redefinir senha.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.overlayGradient} />
            <main className={styles.scrollContainer}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <img src={logo} alt="Logo" className={styles.logo} />
                    </div>
                    <h1>Gerenciamento Premium</h1>
                    <p>
                        {verifying && 'Verificando link...'}
                        {!verifying && !tokenValid && 'Link inválido ou expirado'}
                        {!verifying && tokenValid && success && 'Senha alterada com sucesso!'}
                        {!verifying && tokenValid && !success && 'Defina uma nova senha'}
                    </p>
                </div>

                {!verifying && !tokenValid && (
                    <>
                        <div className={styles.errorContainer}>{tokenError}</div>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className={styles.submitButton}
                        >
                            <div className={styles.goldGradient}>Voltar ao login</div>
                        </button>
                    </>
                )}

                {!verifying && tokenValid && success && (
                    <div className={styles.successMessage}>
                        <div className={styles.successIcon}>✓</div>
                        <h3>Tudo certo!</h3>
                        <p>Você já pode entrar com sua nova senha.</p>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className={styles.okButton}
                        >
                            <div className={styles.goldGradient}>Ir para login</div>
                        </button>
                    </div>
                )}

                {!verifying && tokenValid && !success && (
                    <>
                        {tokenEmail && (
                            <p style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: 14, color: '#555' }}>
                                Redefinindo senha de <strong>{tokenEmail}</strong>
                            </p>
                        )}

                        {error && <div className={styles.errorContainer}>{error}</div>}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="password">Nova senha</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Pelo menos 6 caracteres"
                                        required
                                        minLength="6"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={styles.passwordToggle}
                                    >
                                        {showPassword ? 'ABC' : '***'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="confirmPassword">Confirmar senha</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repita a nova senha"
                                        required
                                        minLength="6"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={submitting || password.length < 6 || password !== confirmPassword}
                            >
                                <div className={styles.goldGradient}>
                                    {submitting ? 'Salvando...' : 'Redefinir senha'}
                                </div>
                            </button>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
};

export default ResetPasswordScreen;
