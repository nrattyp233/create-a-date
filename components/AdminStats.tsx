import React, { useState, useEffect } from 'react';
import { User } from '../types';
import * as api from '../services/api';
import { ColorTheme } from '../constants';

interface AdminStatsProps {
  activeColorTheme: ColorTheme;
}

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  regularUsers: number;
  totalRevenue: number;
  recentPayments: Array<{
    id: string;
    userId: number;
    amount: number;
    date: string;
    status: string;
  }>;
}

const AdminStats: React.FC<AdminStatsProps> = ({ activeColorTheme }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get all users to calculate statistics
      const users = await api.getUsers();
      const adminStats = await api.getAdminStats();
      
      const totalUsers = users.length;
      const premiumUsers = users.filter(user => user.isPremium).length;
      const regularUsers = totalUsers - premiumUsers;
      
      setStats({
        totalUsers,
        premiumUsers,
        regularUsers,
        totalRevenue: adminStats.totalRevenue,
        recentPayments: adminStats.recentPayments
      });
    } catch (err) {
      console.error('Error loading admin stats:', err);
      setError('Failed to load admin statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${activeColorTheme.text}`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <p>{error}</p>
        <button 
          onClick={loadStats}
          className={`mt-4 px-4 py-2 rounded-lg ${activeColorTheme.bg} text-white hover:opacity-90 transition-opacity`}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 p-8">
        No statistics available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Platform statistics and revenue overview</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-3 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${activeColorTheme.bg} flex items-center justify-center`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-dark-3 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Premium Users</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.premiumUsers}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-dark-3 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Regular Users</p>
              <p className="text-2xl font-bold text-blue-400">{stats.regularUsers}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-dark-3 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* User Breakdown Chart */}
      <div className="bg-dark-3 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">User Distribution</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Premium Users</span>
              <span>{stats.premiumUsers} ({((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full" 
                style={{ width: `${(stats.premiumUsers / stats.totalUsers) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-3">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Regular Users</span>
              <span>{stats.regularUsers} ({((stats.regularUsers / stats.totalUsers) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(stats.regularUsers / stats.totalUsers) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-dark-3 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Premium Upgrades</h3>
        {stats.recentPayments.length > 0 ? (
          <div className="space-y-3">
            {stats.recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div>
                  <p className="text-white">User #{payment.userId}</p>
                  <p className="text-sm text-gray-400">{new Date(payment.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">${payment.amount}</p>
                  <p className={`text-xs ${payment.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center">No recent payments</p>
        )}
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button 
          onClick={loadStats}
          className={`px-6 py-2 rounded-lg ${activeColorTheme.bg} text-white hover:opacity-90 transition-opacity`}
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AdminStats;