import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  regularUsers: number;
  totalRevenueCents: number;
}

const currency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const [{ count: totalUsers }, { count: premiumUsers }, revenue] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
          supabase.from('orders').select('amount,status').eq('status', 'paid')
        ]);

        const totalRevenueCents = (revenue.data || []).reduce((sum: number, row: any) => {
          const amountStr: string = row.amount || '0';
          // PayPal webhook stores decimal string (e.g., '10.00'); convert to cents
          const cents = Math.round(parseFloat(amountStr) * 100);
          return sum + (isFinite(cents) ? cents : 0);
        }, 0);

        const regularUsers = (totalUsers || 0) - (premiumUsers || 0);

        setStats({
          totalUsers: totalUsers || 0,
          premiumUsers: premiumUsers || 0,
          regularUsers,
          totalRevenueCents
        });
      } catch (e: any) {
        console.error('Failed to fetch admin stats', e);
        setError('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-center pt-10">Loading stats…</div>;
  if (error) return <div className="text-center pt-10 text-red-500">{error}</div>;
  if (!stats) return null;

  return (
    <div className="max-w-3xl mx-auto bg-dark-2 p-6 rounded-2xl border border-dark-3">
      <h2 className="text-2xl font-bold text-white mb-4">Admin Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-dark-3 bg-dark-3/50">
          <p className="text-gray-400 text-sm">Total Users</p>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="p-4 rounded-xl border border-dark-3 bg-dark-3/50">
          <p className="text-gray-400 text-sm">Premium Users</p>
          <p className="text-3xl font-bold text-amber-300">{stats.premiumUsers}</p>
        </div>
        <div className="p-4 rounded-xl border border-dark-3 bg-dark-3/50">
          <p className="text-gray-400 text-sm">Regular Users</p>
          <p className="text-3xl font-bold">{stats.regularUsers}</p>
        </div>
        <div className="p-4 rounded-xl border border-dark-3 bg-dark-3/50">
          <p className="text-gray-400 text-sm">Revenue (Paid)</p>
          <p className="text-3xl font-bold text-green-400">{currency(stats.totalRevenueCents)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4">Revenue is computed from orders with status = 'paid' received via PayPal webhook.</p>
    </div>
  );
};

export default AdminStats;
