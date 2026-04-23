import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { userData } from '../../users';
import { loginUser, signupUser } from '../../api/auth';
import './Login.css';

interface FormData {
    email: string;
    password: string;
    name: string;
}

interface LoginProps {
    setUser: React.Dispatch<React.SetStateAction<userData | null>>;
}

function Login({ setUser }: LoginProps) {
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        name: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            navigate('/');
        }
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isSignup) {
                await signupUser(formData.name, formData.email, formData.password);
                setSuccess('Registration successful! You can now log in.');
                setTimeout(() => {
                    setIsSignup(false);
                    setFormData({ email: formData.email, password: '', name: '' });
                    setSuccess('');
                }, 2000);
            } else {
                const result: userData | null = await loginUser(formData.email, formData.password);
                if (result && result.token) {
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('userData', JSON.stringify(result));

                    setUser(result);

                    setSuccess(`Welcome ${result.name}!`);
                    navigate('/');
                } else {
                    setError('Login failed. Check your credentials.');
                }
            }
        } catch (error) {
            setError(isSignup ? 'Error during signup.' : 'Error during login.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignup(!isSignup);
        setError('');
        setSuccess('');
        setFormData({ email: '', password: '', name: '' });
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1>{isSignup ? 'Create an account' : 'Login'}</h1>
                        <p>{isSignup ? "Join UFood today" : 'Sign in to your account'}</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        {isSignup && (
                            <div className="form-group">
                                <label htmlFor="name">Full name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Your full name"
                                    required
                                    className="form-input"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="you@example.com"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                required
                                className="form-input"
                            />
                        </div>

                        <button
                            type="submit"
                            className={`submit-btn ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : (isSignup ? 'Create account' : 'Sign in')}
                        </button>
                    </form>

                    <div className="toggle-mode">
                        <p>
                            {isSignup ? 'Already have an account?' : "Don't have an account?"}
                            <button type="button" className="toggle-btn" onClick={toggleMode}>
                                {isSignup ? 'Sign in' : 'Sign up'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;