import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SplineScene } from "@/components/ui/splite";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        fullName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register(formData);
            navigate('/login');
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-auth-wrapper">
            <div className="split-container">
                {/* 3D Scene integrated on the left for Register (opposite of login for variety) */}
                <div className="scene-container">
                    <SplineScene
                        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                        className="w-full h-full"
                    />
                </div>

                {/* Original Neumorphic Register Box */}
                <div className="login-container">
                    <div className="login-card" style={{ padding: '35px 35px' }}>
                        <div className="login-header" style={{ marginBottom: '25px' }}>
                            <div className="neu-icon" style={{ width: '60px', height: '60px', marginBottom: '15px' }}>
                                <div className="icon-inner" style={{ width: '30px', height: '30px' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="8.5" cy="7" r="4" />
                                        <line x1="20" y1="8" x2="20" y2="14" />
                                        <line x1="17" y1="11" x2="23" y2="11" />
                                    </svg>
                                </div>
                            </div>
                            <h2>Create Account</h2>
                            <p>Join our community today</p>
                        </div>

                        {error && <div className="error-msg">{error}</div>}

                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <div className="neu-input">
                                    <input
                                        type="text"
                                        id="fullName"
                                        required
                                        placeholder=" "
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                    <label htmlFor="fullName">Full Name</label>
                                    <div className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <div className="neu-input">
                                    <input
                                        type="text"
                                        id="username"
                                        required
                                        placeholder=" "
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                    <label htmlFor="username">Username</label>
                                    <div className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <div className="neu-input">
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        placeholder=" "
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    <label htmlFor="email">Email Address</label>
                                    <div className="input-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
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

                            <button type="submit" className="neu-button" disabled={loading} style={{ marginTop: '10px' }}>
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </form>

                        <div className="signup-link" style={{ marginTop: '20px' }}>
                            <p>Already a member? <span onClick={() => navigate('/login')}>Sign in</span></p>
                        </div>
                    </div>
                </div>
            </div>
            {loading && <FullScreenLoader />}
        </div>
    );
};

export default Register;
