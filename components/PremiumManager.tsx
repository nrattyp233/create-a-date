import React, { useState } from 'react';
import { User } from '../types';
import { CrownIcon, CalendarIcon, HeartIcon, SparklesIcon, XIcon } from '../constants';
import { useToast } from '../contexts/ToastContext';

interface PremiumManagerProps {
    users: User[];
    onUpdateUser: (updatedUser: User) => void;
}

const PremiumManager: React.FC<PremiumManagerProps> = ({ users, onUpdateUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'premium' | 'free'>('all');
    const { showToast } = useToast();

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || 
                            (filterStatus === 'premium' && user.isPremium) ||
                            (filterStatus === 'free' && !user.isPremium);
        return matchesSearch && matchesFilter;
    });

    const handleTogglePremium = (user: User) => {
        const updatedUser = {
            ...user,
            isPremium: !user.isPremium
        };
        onUpdateUser(updatedUser);
        showToast(
            `${user.name} ${updatedUser.isPremium ? 'upgraded to' : 'downgraded from'} Premium`,
            updatedUser.isPremium ? 'success' : 'info'
        );
    };

    const premiumUsers = users.filter(u => u.isPremium);
    const freeUsers = users.filter(u => !u.isPremium);
    const totalRevenue = premiumUsers.length * 9.99; // Assuming $9.99/month

    return (
        <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
            {/* Header with Stats */}
            <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3">
                <div className="flex items-center gap-3 mb-6">
                    <CrownIcon className="w-8 h-8 text-yellow-400" />
                    <h2 className="text-3xl font-bold text-white">Premium Service Manager</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-dark-3 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{premiumUsers.length}</div>
                        <div className="text-gray-300 text-sm">Premium Users</div>
                    </div>
                    <div className="bg-dark-3 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-400">{freeUsers.length}</div>
                        <div className="text-gray-300 text-sm">Free Users</div>
                    </div>
                    <div className="bg-dark-3 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-white">{users.length}</div>
                        <div className="text-gray-300 text-sm">Total Users</div>
                    </div>
                    <div className="bg-dark-3 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</div>
                        <div className="text-gray-300 text-sm">Monthly Revenue</div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-3 border border-dark-3 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-pink focus:border-brand-pink transition"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                filterStatus === 'all' 
                                    ? 'bg-brand-pink text-white' 
                                    : 'bg-dark-3 text-gray-300 hover:bg-dark-1'
                            }`}
                        >
                            All Users
                        </button>
                        <button
                            onClick={() => setFilterStatus('premium')}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                                filterStatus === 'premium' 
                                    ? 'bg-yellow-600 text-white' 
                                    : 'bg-dark-3 text-gray-300 hover:bg-dark-1'
                            }`}
                        >
                            <CrownIcon className="w-4 h-4" />
                            Premium
                        </button>
                        <button
                            onClick={() => setFilterStatus('free')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                filterStatus === 'free' 
                                    ? 'bg-gray-600 text-white' 
                                    : 'bg-dark-3 text-gray-300 hover:bg-dark-1'
                            }`}
                        >
                            Free
                        </button>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-dark-2 rounded-2xl border border-dark-3 overflow-hidden">
                <div className="p-4 border-b border-dark-3">
                    <h3 className="text-xl font-bold text-white">
                        User Management ({filteredUsers.length} users)
                    </h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <SparklesIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No users found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-dark-3">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="p-4 hover:bg-dark-3/50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-brand-pink to-brand-purple rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-white">{user.name}</h4>
                                                    {user.isPremium && (
                                                        <CrownIcon className="w-5 h-5 text-yellow-400" />
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm">{user.email || 'No email'}</p>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                    <span>Age: {user.age}</span>
                                                    <span>Gender: {user.gender}</span>
                                                    <span>Badges: {user.earnedBadgeIds.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className={`font-semibold ${user.isPremium ? 'text-yellow-400' : 'text-gray-400'}`}>
                                                    {user.isPremium ? 'Premium' : 'Free'}
                                                </div>
                                                {user.isPremium && (
                                                    <div className="text-xs text-gray-500">$9.99/month</div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleTogglePremium(user)}
                                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                                    user.isPremium
                                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                }`}
                                            >
                                                {user.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Features Info */}
            <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-yellow-400" />
                    Premium Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-dark-3 rounded-lg p-4">
                        <HeartIcon className="w-8 h-8 text-red-400 mb-2" />
                        <h4 className="font-semibold text-white mb-1">Unlimited Swipes</h4>
                        <p className="text-gray-400 text-sm">No daily swipe limits</p>
                    </div>
                    <div className="bg-dark-3 rounded-lg p-4">
                        <SparklesIcon className="w-8 h-8 text-purple-400 mb-2" />
                        <h4 className="font-semibold text-white mb-1">AI Features</h4>
                        <p className="text-gray-400 text-sm">Icebreakers & wingman tips</p>
                    </div>
                    <div className="bg-dark-3 rounded-lg p-4">
                        <CalendarIcon className="w-8 h-8 text-blue-400 mb-2" />
                        <h4 className="font-semibold text-white mb-1">Unlimited Messages</h4>
                        <p className="text-gray-400 text-sm">Chat without restrictions</p>
                    </div>
                    <div className="bg-dark-3 rounded-lg p-4">
                        <CrownIcon className="w-8 h-8 text-yellow-400 mb-2" />
                        <h4 className="font-semibold text-white mb-1">Premium Badge</h4>
                        <p className="text-gray-400 text-sm">Stand out with premium status</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumManager;
