import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaSpinner, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import { GiHearts, GiDiamonds, GiClubs, GiSpades } from 'react-icons/gi';

import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
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
            <div className={styles.scrollContainer}>
                <div className={styles.loginCardWrapper}>
                    <div className={styles.form}>
                        <div className={styles.header}>
                            <div className={styles.suitIcons}>
                                <GiSpades />
                                <GiHearts />
                                <GiDiamonds />
                                <GiClubs />
                            </div>
                            <h1 className={styles.title}>FUTEBOL STUDIO</h1>
                            <p className={styles.subtitle}>NOVA SENHA</p>
                        </div>

                        {verifying && (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <FaSpinner className={styles.spinner} />
                                <p style={{ marginTop: 12 }}>Verificando link...</p>
                            </div>
                        )}

                        {!verifying && !tokenValid && (
                            <div style={{ width: '100%' }}>
                                <div className={styles.errorContainer}>{tokenError}</div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className={styles.submitButton}
                                >
                                    <div className={styles.goldGradient}>VOLTAR AO LOGIN</div>
                                </button>
                            </div>
                        )}

                        {!verifying && tokenValid && success && (
                            <div style={{ textAlign: 'center', width: '100%' }}>
                                <div className={styles.successIcon}><FaCheck /></div>
                                <h2 style={{ margin: '12px 0' }}>Senha alterada!</h2>
                                <p style={{ marginBottom: 20 }}>Você já pode entrar com sua nova senha.</p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className={styles.submitButton}
                                >
                                    <div className={styles.goldGradient}>IR PARA LOGIN</div>
                                </button>
                            </div>
                        )}

                        {!verifying && tokenValid && !success && (
                            <form style={{ width: '100%' }} onSubmit={handleSubmit}>
                                {tokenEmail && (
                                    <p style={{ textAlign: 'center', marginBottom: 16, opacity: 0.8 }}>
                                        Redefinindo senha de <strong>{tokenEmail}</strong>
                                    </p>
                                )}

                                {error && <div className={styles.errorContainer}>{error}</div>}

                                <div className={styles.inputGroup}>
                                    <label htmlFor="password">NOVA SENHA</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder=".........."
                                            required
                                            minLength="6"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className={styles.passwordToggle}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label htmlFor="confirmPassword">CONFIRMAR SENHA</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            id="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder=".........."
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
                                        {submitting ? <FaSpinner className={styles.spinner} /> : 'REDEFINIR SENHA'}
                                    </div>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordScreen;
