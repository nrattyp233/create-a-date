import React, { useState, useEffect } from 'react';
import { AdminStats, ColorTheme } from '../types';
import { CrownIcon, UserIcon } from '../constants';
import * as api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface StatsViewProps {
    activeColorTheme: ColorTheme;
}

const StatsCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({
    title,
    value,
    icon,
    color
}) => (
    <div className={`${color} rounded-xl p-6 border border-dark-3`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <p className="text-3xl font-bold text-white mt-1">{value}</p>
            </div>
            <div className="text-gray-300">
                {icon}
            </div>
        </div>
    </div>
);

const StatsView: React.FC<StatsViewProps> = ({ activeColorTheme }) => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const adminStats = await api.getAdminStats();
                setStats(adminStats);
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
                showToast('Failed to load statistics', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [showToast]);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400">Loading statistics...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-dark-2 rounded-xl p-6 border border-dark-3 animate-pulse">
                            <div className="h-4 bg-gray-600 rounded mb-2"></div>
                            <div className="h-8 bg-gray-600 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="max-w-6xl mx-auto text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Admin Dashboard</h1>
                <p className="text-red-400">Failed to load statistics. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-gray-400">Monitor your Create-A-Date application</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={<UserIcon className="w-8 h-8" />}
                    color="bg-dark-2"
                />
                <StatsCard
                    title="Premium Users"
                    value={stats.premiumUsers}
                    icon={<CrownIcon className="w-8 h-8" />}
                    color="bg-gradient-to-br from-yellow-500/20 to-dark-2"
                />
                <StatsCard
                    title="Regular Users"
                    value={stats.regularUsers}
                    icon={<UserIcon className="w-8 h-8" />}
                    color="bg-dark-2"
                />
                <StatsCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    icon={<span className="text-2xl">💰</span>}
                    color={`bg-gradient-to-br ${activeColorTheme.bg}/20 to-dark-2`}
                />
            </div>

            {/* Recent Payments */}
            <div className="bg-dark-2 rounded-xl border border-dark-3 overflow-hidden">
                <div className="p-6 border-b border-dark-3">
                    <h2 className="text-2xl font-bold text-white">Recent Premium Payments</h2>
                    <p className="text-gray-400 mt-1">Latest transactions from premium upgrades</p>
                </div>
                
                {stats.recentPayments.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-400">No payments recorded yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-3/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Payment ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        User ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-3">
                                {stats.recentPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-dark-3/30">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {payment.paypalTransactionId || payment.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {payment.userId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                            ${payment.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                payment.status === 'completed' 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : payment.status === 'pending'
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsView;