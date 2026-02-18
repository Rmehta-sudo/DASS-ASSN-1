import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";

const Signup = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        contactNumber: '',
        collegeName: '',
    });
    const [error, setError] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!captchaToken) {
            setError('Please complete the CAPTCHA');
            return;
        }

        // Basic validation
        if (formData.email.endsWith('iiit.ac.in')) {
            // If IIIT email, college name is auto-set in backend, but good to show UI feedback maybe?
            // For now, simple student logic
        } else {
            if (!formData.collegeName) {
                setError("College name is required for Non-IIIT students");
                return;
            }
        }

        const result = await register({ ...formData, captchaToken });
        if (result.success) {
            navigate('/onboarding');
        } else {
            setError(result.message);
            setCaptchaToken(null);
        }
    };

    const isIIIT = formData.email.endsWith('iiit.ac.in');

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-xl w-full max-w-md">
                <h3 className="text-2xl font-bold text-center text-indigo-600">Join Felicity</h3>
                {error && <div className="p-2 my-2 text-sm text-red-700 bg-red-100 rounded">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-2">
                        <div className="mt-4 w-1/2">
                            <label className="block">First Name</label>
                            <input type="text" name="firstName" placeholder="First Name"
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                                onChange={handleChange} required />
                        </div>
                        <div className="mt-4 w-1/2">
                            <label className="block">Last Name</label>
                            <input type="text" name="lastName" placeholder="Last Name"
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                                onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block">Email</label>
                        <input type="email" name="email" placeholder="Email"
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            onChange={handleChange} required />
                    </div>
                    <div className="mt-4">
                        <label className="block">Password</label>
                        <input type="password" name="password" placeholder="Password"
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            onChange={handleChange} required />
                    </div>
                    <div className="mt-4">
                        <label className="block">Contact Number</label>
                        <input type="text" name="contactNumber" placeholder="Contact Number"
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            onChange={handleChange} required />
                    </div>

                    {/* Conditionally show college name if not IIIT email */}
                    {!isIIIT && (
                        <div className="mt-4">
                            <label className="block">College / Org Name</label>
                            <input type="text" name="collegeName" placeholder="College Name"
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                                onChange={handleChange} />
                        </div>
                    )}

                    <div className="mt-4 flex justify-center">
                        <ReCAPTCHA
                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                            onChange={(token) => setCaptchaToken(token)}
                        />
                    </div>

                    <div className="flex items-baseline justify-between">
                        <button className="px-6 py-2 mt-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-900 w-full">Sign Up</button>
                    </div>
                    <div className="mt-4 text-sm text-center">
                        Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
