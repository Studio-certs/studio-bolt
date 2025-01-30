import React, { useState, useEffect } from 'react';
    import { supabase } from '../../lib/supabase';
    import { Clock } from 'lucide-react';
    import { format } from 'date-fns';

    interface Transaction {
      id: string;
      admin: {
        full_name: string;
      };
      user: {
        full_name: string;
      };
      tokens: number;
      created_at: string;
    }

    export default function TransactionManagement() {
      const [transactions, setTransactions] = useState<Transaction[]>([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        fetchTransactions();
      }, []);

      async function fetchTransactions() {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select(`
              *,
              admin:admin_id(full_name),
              user:user_id(full_name)
            `)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setTransactions(data || []);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setLoading(false);
        }
      }

      if (loading) {
        return (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      }

      return (
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Transactions</h1>
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.user?.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.admin?.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.tokens}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
