import React, { useState } from 'react';
import { User } from '../types';
import { CrownIcon, CalendarIcon, HeartIcon, SparklesIcon, ChatIcon, CheckIcon, XIcon } from '../constants';
import { useToast } from '../contexts/ToastContext';

interface PremiumSubscriptionProps {
    currentUser: User;
    onUpgrade: () => void;
}

const PremiumSubscription: React.FC<PremiumSubscriptionProps> = ({ currentUser, onUpgrade }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();

    const handleUpgrade = async () => {
        setIsProcessing(true);
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            onUpgrade();
            showToast('Welcome to Premium! 🎉', 'success');
        } catch (error) {
            showToast('Upgrade failed. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelSubscription = () => {
        if (confirm('Are you sure you want to cancel your Premium subscription? You will lose access to all premium features immediately.')) {
            showToast('Premium subscription cancelled. We\'re sorry to see you go!', 'info');
            // In a real app, this would call an API to cancel the subscription
        }
    };

    const premiumFeatures = [
        {
            icon: HeartIcon,
            title: 'Unlimited Swipes',
            description: 'Swipe without daily limits',
            free: '10 per day',
            premium: 'Unlimited'
        },
        {
            icon: SparklesIcon,
            title: 'AI-Powered Features',
            description: 'Icebreakers, compatibility scores, and more',
            free: 'Limited',
            premium: 'Full access'
        },
        {
            icon: ChatIcon,
            title: 'Unlimited Messages',
            description: 'Chat without restrictions',
            free: '5 messages',
            premium: 'Unlimited'
        },
        {
            icon: CalendarIcon,
            title: 'Priority in Date Marketplace',
            description: 'Your date ideas appear first',
            free: false,
            premium: true
        },
        {
            icon: CrownIcon,
            title: 'Premium Badge',
            description: 'Stand out with premium status',
            free: false,
            premium: true
        },
        {
            icon: SparklesIcon,
            title: 'Wingman AI Assistant',
            description: 'Real-time conversation tips',
            free: false,
            premium: true
        }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            {/* Current Status */}
            <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-pink to-brand-purple rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                {currentUser.name}
                                {currentUser.isPremium && <CrownIcon className="w-6 h-6 text-yellow-400" />}
                            </h2>
                            <p className="text-gray-300">
                                Current Plan: <span className={`font-semibold ${currentUser.isPremium ? 'text-yellow-400' : 'text-gray-400'}`}>
                                    {currentUser.isPremium ? 'Premium' : 'Free'}
                                </span>
                            </p>
                        </div>
                    </div>
                    
                    {currentUser.isPremium ? (
                        <div className="text-right">
                            <div className="text-yellow-400 font-bold text-lg">$9.99/month</div>
                            <div className="text-gray-400 text-sm">Next billing: Oct 10, 2025</div>
                        </div>
                    ) : (
                        <div className="text-right">
                            <div className="text-gray-400 font-bold text-lg">$0.00</div>
                            <div className="text-gray-500 text-sm">Free plan</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Feature Comparison */}
            <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Features Comparison</h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-dark-3">
                                <th className="text-left py-4 text-white font-semibold">Feature</th>
                                <th className="text-center py-4 text-gray-400 font-semibold">Free</th>
                                <th className="text-center py-4 text-yellow-400 font-semibold">Premium</th>
                            </tr>
                        </thead>
                        <tbody>
                            {premiumFeatures.map((feature, index) => (
                                <tr key={index} className="border-b border-dark-3/50">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <feature.icon className="w-6 h-6 text-brand-pink" />
                                            <div>
                                                <div className="text-white font-medium">{feature.title}</div>
                                                <div className="text-gray-400 text-sm">{feature.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        {typeof feature.free === 'boolean' ? (
                                            feature.free ? (
                                                <CheckIcon className="w-5 h-5 text-green-400 mx-auto" />
                                            ) : (
                                                <XIcon className="w-5 h-5 text-red-400 mx-auto" />
                                            )
                                        ) : (
                                            <span className="text-gray-400">{feature.free}</span>
                                        )}
                                    </td>
                                    <td className="py-4 text-center">
                                        {typeof feature.premium === 'boolean' ? (
                                            feature.premium ? (
                                                <CheckIcon className="w-5 h-5 text-green-400 mx-auto" />
                                            ) : (
                                                <XIcon className="w-5 h-5 text-red-400 mx-auto" />
                                            )
                                        ) : (
                                            <span className="text-yellow-400 font-medium">{feature.premium}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Section */}
            <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3">
                {!currentUser.isPremium ? (
                    <div className="text-center space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h3>
                            <p className="text-gray-300">Unlock all features and find your perfect match faster!</p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-brand-pink to-brand-purple p-6 rounded-xl text-center">
                            <div className="text-white">
                                <div className="text-4xl font-bold">$9.99</div>
                                <div className="text-brand-light">per month</div>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleUpgrade}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-glow-pink disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CrownIcon className="w-6 h-6" />
                                    Upgrade to Premium
                                </>
                            )}
                        </button>
                        
                        <p className="text-gray-500 text-sm">
                            Cancel anytime. No commitment required.
                        </p>
                    </div>
                ) : (
                    <div className="text-center space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-2 flex items-center justify-center gap-2">
                                <CrownIcon className="w-8 h-8" />
                                You're a Premium Member!
                            </h3>
                            <p className="text-gray-300">Enjoy unlimited access to all premium features.</p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 p-6 rounded-xl text-center">
                            <div className="text-white">
                                <div className="text-2xl font-bold">Premium Active</div>
                                <div className="text-yellow-100">Next billing: October 10, 2025</div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <button className="w-full bg-dark-3 text-white font-medium py-3 px-6 rounded-lg hover:bg-dark-1 transition">
                                Update Payment Method
                            </button>
                            <button className="w-full bg-dark-3 text-white font-medium py-3 px-6 rounded-lg hover:bg-dark-1 transition">
                                Download Receipts
                            </button>
                            <button 
                                onClick={handleCancelSubscription}
                                className="w-full bg-red-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-red-700 transition"
                            >
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremiumSubscription;
