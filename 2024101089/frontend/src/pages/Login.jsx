import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!captchaToken) {
            setError('Please complete the CAPTCHA');
            return;
        }

        const result = await login(email, password, captchaToken);
        if (result.success) {
            // Check role from result or localStorage
            if (result.user.role === 'admin') {
                navigate('/admin/dashboard'); // Fixed path
            } else if (result.user.role === 'organizer') {
                navigate('/organizer/dashboard');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(result.message);
            setCaptchaToken(null); // Reset CAPTCHA on error
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-xl w-96">
                <h3 className="text-2xl font-bold text-center text-indigo-600">Login to Felicity</h3>
                {error && <div className="p-2 my-2 text-sm text-red-700 bg-red-100 rounded">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mt-4">
                        <label className="block" htmlFor="email">Email</label>
                        <input type="email" placeholder="Email"
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="mt-4">
                        <label className="block">Password</label>
                        <input type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={password} onChange={(e) => setPassword(e.target.value)} />
                        <div className="flex justify-between mt-1">
                            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">Forgot Password?</Link>
                            <Link to="/reset-request" className="text-sm text-gray-500 hover:underline">Organizer Issue?</Link>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                        <ReCAPTCHA
                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                            onChange={(token) => setCaptchaToken(token)}
                        />
                    </div>

                    <div className="flex items-baseline justify-between">
                        <button className="px-6 py-2 mt-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-900">Login</button>
                    </div>
                    <div className="mt-4 text-sm text-center">
                        Don't have an account? <Link to="/signup" className="text-indigo-600 hover:underline">Sign up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
