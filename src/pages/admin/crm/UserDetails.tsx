import React, { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { MapPin, Globe, Linkedin, Github, Twitter, BookOpen, Clock, Award, Plus, Wallet, Check, UserIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { User } from '../../../types/crm';
import CourseAssignmentDialog from './CourseAssignmentDialog';

interface UserDetailsProps {
  user: User;
}

interface TokenType {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  conversion_rate: number;
}

interface TokenBalance {
  tokens: number;
  token_type: TokenType;
}

export default function UserDetails({ user }: UserDetailsProps) {
  const [showCourseAssignment, setShowCourseAssignment] = useState(false);
  const [addingTokens, setAddingTokens] = useState(false);
  const [tokensToAdd, setTokensToAdd] = useState(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [tokenTypes, setTokenTypes] = useState<TokenType[]>([]);
  const [selectedTokenType, setSelectedTokenType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenData();
  }, [user.id]);

  const fetchTokenData = async () => {
    try {
      // Fetch token types
      const { data: tokenTypesData, error: tokenTypesError } = await supabase
        .from('token_types')
        .select('*')
        .order('name');

      if (tokenTypesError) throw tokenTypesError;
      setTokenTypes(tokenTypesData || []);
      if (tokenTypesData?.length > 0) {
        setSelectedTokenType(tokenTypesData[0].id);
      }

      // Fetch user's token balances
      const { data: balancesData, error: balancesError } = await supabase
        .from('user_wallets')
        .select(`
          tokens,
          token_type:token_type_id (
            id,
            name,
            description,
            image_url,
            conversion_rate
          )
        `)
        .eq('user_id', user.id);

      if (balancesError) throw balancesError;
      setTokenBalances(balancesData || []);
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  const handleAddTokens = async () => {
    if (!user || !tokensToAdd || !selectedTokenType) return;

    setAddingTokens(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      // Create a new transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          admin_id: authData?.user?.id,
          user_id: user.id,
          tokens: tokensToAdd,
          token_type_id: selectedTokenType
        });

      if (transactionError) throw transactionError;

      // Update user's wallet
      const { data: existingWallet, error: fetchError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('token_type_id', selectedTokenType)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingWallet) {
        // Update existing wallet
        const { error: updateError } = await supabase
          .from('user_wallets')
          .update({
            tokens: existingWallet.tokens + tokensToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('token_type_id', selectedTokenType);

        if (updateError) throw updateError;
      } else {
        // Create new wallet entry for this token type
        const { error: insertError } = await supabase
          .from('user_wallets')
          .insert({
            user_id: user.id,
            token_type_id: selectedTokenType,
            tokens: tokensToAdd
          });

        if (insertError) throw insertError;
      }

      // Refresh token balances
      fetchTokenData();
      setSuccess(`Successfully added ${tokensToAdd} tokens to user's wallet`);
      setTokensToAdd(0);
    } catch (error: any) {
      console.error('Error adding tokens:', error);
      setError(error.message || 'Failed to add tokens');
    } finally {
      setAddingTokens(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <img
            src={user.avatar_url || 'https://via.placeholder.com/100'}
            alt={user.full_name}
            className="w-20 h-20 rounded-full mr-4"
          />
          <div>
            <h2 className="text-2xl font-semibold">{user.full_name}</h2>
            {user.headline && (
              <p className="text-gray-600 mt-1">{user.headline}</p>
            )}
            {user.location && (
              <p className="flex items-center text-gray-600 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {user.location}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCourseAssignment(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Assign Course
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800"
          >
            <Globe className="w-5 h-5" />
          </a>
        )}
        {user.linkedin_url && (
          <a
            href={user.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        )}
        {user.github_url && (
          <a
            href={user.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800"
          >
            <Github className="w-5 h-5" />
          </a>
        )}
        {user.twitter_url && (
          <a
            href={user.twitter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800"
          >
            <Twitter className="w-5 h-5" />
          </a>
        )}
      </div>

      {user.bio && (
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700">{user.bio}</p>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Wallet</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-4">
            {tokenBalances.map((balance, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  {balance.token_type.image_url ? (
                    <img
                      src={balance.token_type.image_url}
                      alt={balance.token_type.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{balance.token_type.name}</p>
                    <p className="text-sm text-gray-500">{balance.token_type.description}</p>
                  </div>
                </div>
                <p className="text-lg font-semibold">{balance.tokens}</p>
              </div>
            ))}

            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2">
                <select
                  value={selectedTokenType}
                  onChange={(e) => setSelectedTokenType(e.target.value)}
                  className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {tokenTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={tokensToAdd}
                  onChange={(e) => setTokensToAdd(parseInt(e.target.value) || 0)}
                  className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Amount"
                  min="0"
                />
                <button
                  onClick={handleAddTokens}
                  disabled={addingTokens || !tokensToAdd || !selectedTokenType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {addingTokens ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tokens
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Course Progress</h3>
        {user.enrollments?.length > 0 ? (
          <div className="space-y-2">
            {user.enrollments.map((enrollment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{enrollment.course.title}</h4>
                  <p className="text-sm text-gray-500">{enrollment.course.level}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{enrollment.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No courses enrolled yet.</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Meetups Attended</h3>
        {user.meetups?.length > 0 ? (
          <ul className="space-y-2">
            {user.meetups.map((meetup, index) => (
              <li key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{meetup.title}</h4>
                  <p className="text-sm text-gray-500">
                    {isValid(new Date(meetup.event_date)) ? format(new Date(meetup.event_date), 'MMM d, yyyy') : 'Invalid Date'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No meetups attended yet.</p>
        )}
      </div>

      {showCourseAssignment && (
        <CourseAssignmentDialog
          user={user}
          onClose={() => setShowCourseAssignment(false)}
        />
      )}
    </div>
  );
}