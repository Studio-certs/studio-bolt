import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, AlertCircle, Shield, CreditCard, Zap, CheckCircle2, Gift, Coins } from 'lucide-react';

interface TokenType {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  conversion_rate: number;
}

interface TokenPackage {
  amount: number;
  label: string;
  description: string;
  icon: any;
  featured?: boolean;
}

const features = [
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Your transactions are protected with bank-level security'
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Tokens are added to your account immediately'
  },
  {
    icon: Gift,
    title: 'Flexible Packages',
    description: 'Choose the amount that fits your needs'
  }
];

export default function BuyTokens() {
  const [amount, setAmount] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenTypes, setTokenTypes] = useState<TokenType[]>([]);
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType | null>(null);
  const { user, supabase } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTokenTypes();
  }, []);

  const fetchTokenTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('token_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setTokenTypes(data || []);
      if (data && data.length > 0) {
        setSelectedTokenType(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching token types:', error);
      setError('Failed to load token types');
    }
  };

  const getTokenPackages = (conversionRate: number): TokenPackage[] => [
    { amount: 10, label: 'Starter', description: 'Perfect for trying out our platform', icon: Zap },
    { amount: 50, label: 'Basic', description: 'Most popular for beginners', icon: Shield, featured: true },
    { amount: 100, label: 'Pro', description: 'Great value for active learners', icon: Gift },
    { amount: 150, label: 'Elite', description: 'Ideal for dedicated students', icon: CreditCard },
    { amount: 200, label: 'Premium', description: 'Best value for serious learners', icon: CheckCircle2 },
    { amount: 250, label: 'Ultimate', description: 'Maximum learning potential', icon: Wallet }
  ].map(pkg => ({
    ...pkg,
    amount: Math.round(pkg.amount * conversionRate)
  }));

  const handlePurchase = async () => {
    if (!user || !selectedTokenType) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('https://ydvvokjdlqpgpasrnwtd.supabase.co/functions/v1/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount,
          user_id: user.id,
          token_type_id: selectedTokenType.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error('Invalid response from payment service');
      }

      window.location.href = url;
    } catch (err: any) {
      console.error('Payment setup error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please log in to purchase tokens</h2>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const tokenPackages = selectedTokenType ? getTokenPackages(selectedTokenType.conversion_rate) : [];

  return (
    <div className="min-h-[80vh] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Power Up Your Learning Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Purchase tokens to unlock premium courses and accelerate your learning experience
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Token Type Selection */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Token Type
          </label>
          <div className="relative">
            <select
              value={selectedTokenType?.id || ''}
              onChange={(e) => {
                const selected = tokenTypes.find(tt => tt.id === e.target.value);
                setSelectedTokenType(selected || null);
                // Reset amount to the default when changing token type
                if (selected) {
                  setAmount(Math.round(50 * selected.conversion_rate));
                }
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {tokenTypes.map((tokenType) => (
                <option key={tokenType.id} value={tokenType.id}>
                  {tokenType.name} (1 AUD = {tokenType.conversion_rate} tokens)
                </option>
              ))}
            </select>
            <Coins className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {selectedTokenType?.description && (
            <p className="mt-2 text-sm text-gray-500">{selectedTokenType.description}</p>
          )}
        </div>

        {/* Token Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {tokenPackages.map((pkg) => (
            <div
              key={pkg.amount}
              onClick={() => setAmount(pkg.amount)}
              className={`relative bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:-translate-y-1 ${
                amount === pkg.amount ? 'ring-2 ring-blue-500' : ''
              } ${pkg.featured ? 'md:scale-105' : ''}`}
            >
              {pkg.featured && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-tr-lg rounded-bl-lg text-sm font-medium">
                  Popular Choice
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{pkg.label}</h3>
                    <p className="text-gray-500">{pkg.description}</p>
                  </div>
                  <pkg.icon className={`w-8 h-8 ${amount === pkg.amount ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">{pkg.amount} <span className="text-lg font-normal text-gray-500">tokens</span></p>
                  <p className="text-gray-500">${pkg.amount / (selectedTokenType?.conversion_rate || 1)} AUD</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Button */}
        <div className="max-w-md mx-auto text-center">
          <button
            onClick={handlePurchase}
            disabled={loading || !selectedTokenType}
            className="w-full flex items-center justify-center py-3 px-8 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Purchase {amount} {selectedTokenType?.name || 'Tokens'} for ${amount / (selectedTokenType?.conversion_rate || 1)} AUD
              </>
            )}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            By proceeding with the purchase, you agree to our terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
}