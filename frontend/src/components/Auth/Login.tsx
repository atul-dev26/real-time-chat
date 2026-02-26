import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SplineScene } from "@/components/ui/splite";
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();
    const skipRedirectRef = useRef(false);

    useEffect(() => {
        if (currentUser && !loading && !skipRedirectRef.current) {
            navigate('/');
        }
    }, [currentUser, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(formData);
            skipRedirectRef.current = true;
            navigate('/loading');
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-auth-wrapper">
            <div className="split-container">
                {/* Original Neumorphic Login Box */}
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header">
                            <div className="neu-icon">
                                <div className="icon-inner">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                            </div>
                            <h2>Welcome back</h2>
                            <p>Please sign in to continue</p>
                        </div>

                        {error && <div className="error-msg">{error}</div>}

                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <div className="neu-input">
                                    <input
                                        type="text"
                                        id="usernameOrEmail"
                                        required
                                        placeholder=" "
                                        value={formData.usernameOrEmail}
                                        onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                                    />
                                    <label htmlFor="usernameOrEmail">Username or Email</label>
                                    <div className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="neu-input">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        required
                                        placeholder=" "
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <label htmlFor="password">Password</label>
                                    <div className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0110 0v4" />
                                        </svg>
                                    </div>
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="neu-button" disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="signup-link">
                            <p>Don't have an account? <span onClick={() => navigate('/register')}>Sign up</span></p>
                        </div>
                    </div>
                </div>

                {/* 3D Scene integrated on the right */}
                <div className="scene-container">
                    <SplineScene
                        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
