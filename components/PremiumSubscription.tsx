import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { CrownIcon, CalendarIcon, HeartIcon, SparklesIcon, ChatIcon, CheckIcon, XIcon } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabaseClient';

// PayPal client ID
const PAYPAL_CLIENT_ID = "AT54goA2eRHu2YwXO2DtrkJlHTjoec937A_jRliwIPAseM0mEL7NIYwTfWhW_xDU0TWVMKYUta-LfoqE";

interface PremiumSubscriptionProps { currentUser: User; onUpgrade: () => void; }

const PremiumSubscription: React.FC<PremiumSubscriptionProps> = ({ currentUser, onUpgrade }) => {
    const { showToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const paypalRef = useRef<HTMLDivElement>(null);

    const premiumFeatures = [
        { icon: HeartIcon, title: 'Unlimited Swipes', description: 'Swipe without daily limits', free: '10 per day', premium: 'Unlimited' },
        { icon: SparklesIcon, title: 'AI-Powered Features', description: 'Icebreakers, compatibility scores, and more', free: 'Limited', premium: 'Full access' },
        { icon: ChatIcon, title: 'Unlimited Messages', description: 'Chat without restrictions', free: '5 messages', premium: 'Unlimited' },
        { icon: CalendarIcon, title: 'Priority in Date Marketplace', description: 'Your date ideas appear first', free: false, premium: true },
        { icon: CrownIcon, title: 'Premium Badge', description: 'Stand out with premium status', free: false, premium: true },
        { icon: SparklesIcon, title: 'Wingman AI Assistant', description: 'Real-time conversation tips', free: false, premium: true }
    ];

    const pollOrderStatus = (orderId: string, attempt = 0) => {
        if (attempt > 12) {
            showToast('Payment confirmation pending. It may activate shortly.', 'info');
            setIsProcessing(false); return;
        }
        setTimeout(async () => {
            const { data } = await supabase.from('orders').select('status,user_id').eq('order_id', orderId).single();
            if (data?.status === 'paid') {
                // Refetch user profile to get updated isPremium
                const { data: userData } = await supabase.from('users').select('*').eq('id', data.user_id).single();
                if (userData?.is_premium) {
                    showToast('Payment verified! Premium unlocked 🎉', 'success');
                } else {
                    showToast('Payment verified, but premium not yet active. Try refreshing.', 'info');
                }
                setIsProcessing(false);
            }
            else if (data?.status === 'failed') { showToast('Payment failed. Try again.', 'error'); setIsProcessing(false); }
            else pollOrderStatus(orderId, attempt + 1);
        }, 5000);
    };

    useEffect(() => {
        if (!paypalRef.current || currentUser.isPremium) return;
        const load = () => renderButton();
        if (!(window as any).paypal) {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
            script.async = true; script.onload = load; document.body.appendChild(script);
        } else load();

        function renderButton() {
            (window as any).paypal.Buttons({
                style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
                createOrder: async (_d: any, actions: any) => {
                    const tempOrderId = crypto.randomUUID();
                    const { error } = await supabase.from('orders').insert([{ order_id: tempOrderId, user_id: currentUser.id, status: 'pending', amount: 10.00 }]);
                    if (error) { showToast('Could not start payment.', 'error'); throw new Error('order insert failed'); }
                    return actions.order.create({
                        purchase_units: [{ amount: { value: '10.00' }, description: 'Create-A-Date Premium Subscription', invoice_id: tempOrderId }],
                        application_context: { shipping_preference: 'NO_SHIPPING' }
                    });
                },
                onApprove: async (_d: any, actions: any) => {
                    setIsProcessing(true);
                    const details = await actions.order.capture();
                    const invoiceId = details?.purchase_units?.[0]?.invoice_id;
                    if (invoiceId) pollOrderStatus(invoiceId); else { showToast('Verification reference missing.', 'error'); setIsProcessing(false); }
                },
                onError: () => { showToast('PayPal payment failed.', 'error'); setIsProcessing(false); }
            }).render(paypalRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser.isPremium]);

    const handleCancelSubscription = () => {
        if (confirm('Cancel Premium? You will lose access immediately.')) {
            showToast('Cancellation flow not yet implemented.', 'info');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-pink to-brand-purple rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">{currentUser.name} {currentUser.isPremium && <CrownIcon className="w-6 h-6 text-yellow-400" />}</h2>
                            <p className="text-gray-300">Current Plan: <span className={`font-semibold ${currentUser.isPremium ? 'text-yellow-400' : 'text-gray-400'}`}>{currentUser.isPremium ? 'Premium' : 'Free'}</span></p>
                        </div>
                    </div>
                    {currentUser.isPremium ? (
                        <div className="text-right">
                            <div className="text-yellow-400 font-bold text-lg">$9.99/month</div>
                            <div className="text-gray-400 text-sm">Next billing: TBD</div>
                        </div>
                    ) : (
                        <div className="text-right">
                            <div className="text-gray-400 font-bold text-lg">$0.00</div>
                            <div className="text-gray-500 text-sm">Free plan</div>
                        </div>
                    )}
                </div>
            </div>

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
                            {premiumFeatures.map((f, i) => (
                                <tr key={i} className="border-b border-dark-3/50">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <f.icon className="w-6 h-6 text-brand-pink" />
                                            <div>
                                                <div className="text-white font-medium">{f.title}</div>
                                                <div className="text-gray-400 text-sm">{f.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">{typeof f.free === 'boolean' ? (f.free ? <CheckIcon className="w-5 h-5 text-green-400 mx-auto" /> : <XIcon className="w-5 h-5 text-red-400 mx-auto" />) : <span className="text-gray-400">{f.free}</span>}</td>
                                    <td className="py-4 text-center">{typeof f.premium === 'boolean' ? (f.premium ? <CheckIcon className="w-5 h-5 text-green-400 mx-auto" /> : <XIcon className="w-5 h-5 text-red-400 mx-auto" />) : <span className="text-yellow-400 font-medium">{f.premium}</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3">
                {!currentUser.isPremium ? (
                    <div className="text-center space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h3>
                            <p className="text-gray-300">Unlock all features and find your perfect match faster!</p>
                        </div>
                        <div className="bg-gradient-to-r from-brand-pink to-brand-purple p-6 rounded-xl text-center">
                            <div className="text-white"><div className="text-4xl font-bold">$9.99</div><div className="text-brand-light">per month</div></div>
                        </div>
                        <div ref={paypalRef} className="flex justify-center"></div>
                        {isProcessing && <div className="mt-4 text-brand-pink flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-brand-pink border-t-transparent rounded-full animate-spin"></div>Processing payment...</div>}
                        <p className="text-gray-500 text-sm">Cancel anytime. No commitment required.</p>
                    </div>
                ) : (
                    <div className="text-center space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-2 flex items-center justify-center gap-2"><CrownIcon className="w-8 h-8" />You're a Premium Member!</h3>
                            <p className="text-gray-300">Enjoy unlimited access to all premium features.</p>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 p-6 rounded-xl text-center"><div className="text-white"><div className="text-2xl font-bold">Premium Active</div><div className="text-yellow-100">Next billing: TBD</div></div></div>
                        <div className="space-y-3">
                            <button className="w-full bg-dark-3 text-white font-medium py-3 px-6 rounded-lg hover:bg-dark-1 transition">Update Payment Method</button>
                            <button className="w-full bg-dark-3 text-white font-medium py-3 px-6 rounded-lg hover:bg-dark-1 transition">Download Receipts</button>
                            <button onClick={handleCancelSubscription} className="w-full bg-red-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-red-700 transition">Cancel Subscription</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremiumSubscription;
