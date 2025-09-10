import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
    onAuthSuccess: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // Sign in
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onAuthSuccess(data.user);
            } else {
                // Check password confirmation
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                
                // Sign up
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                
                if (data.user) {
                    // Create user profile in our users table
                    const { error: profileError } = await supabase
                        .from('users')
                        .insert([
                            {
                                id: data.user.id,
                                name: email.split('@')[0], // Use email prefix as default name
                                age: 25,
                                bio: '',
                                photos: [],
                                interests: [],
                                gender: 'male',
                                is_premium: false,
                                email: email,
                                preferences: { interestedIn: ['male', 'female'], ageRange: { min: 18, max: 99 } },
                                earned_badge_ids: []
                            }
                        ]);
                    
                    if (profileError) {
                        console.warn('Profile creation error:', profileError);
                    }
                    
                    onAuthSuccess(data.user);
                }
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-1 flex flex-col items-center justify-center p-4 font-sans">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-500 text-transparent bg-clip-text mb-2">
                    Create-A-Date
                </h1>
                <p className="text-xl italic text-brand-light/90 tracking-wide">Beyond the swipe.</p>
            </div>

            <div className="w-full max-w-sm bg-dark-2 p-8 rounded-2xl shadow-lg border border-dark-3">
                <h2 className="text-2xl font-bold text-center text-white mb-6">{isLogin ? 'Sign In' : 'Create Account'}</h2>
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            id="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            className="w-full bg-dark-3 border border-dark-3 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-pink focus:border-brand-pink transition" 
                            placeholder="you@example.com" 
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            className="w-full bg-dark-3 border border-dark-3 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-pink focus:border-brand-pink transition" 
                            placeholder="••••••••" 
                        />
                    </div>
                    {!isLogin && (
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required 
                                className="w-full bg-dark-3 border border-dark-3 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-pink focus:border-brand-pink transition" 
                                placeholder="••••••••" 
                            />
                        </div>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 rounded-lg font-bold transition-all duration-300 bg-gradient-to-r from-brand-pink to-brand-purple text-white hover:opacity-90 hover:shadow-glow-pink disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <button 
                        onClick={() => setIsLogin(!isLogin)} 
                        className="text-sm text-gray-400 hover:text-white transition"
                        disabled={loading}
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;