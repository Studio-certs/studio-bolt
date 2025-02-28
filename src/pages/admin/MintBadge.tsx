import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { web3, adminPrivateKey, isValidAddress } from '../../lib/web3';
import { Award, Search, Users, X, Check, Loader2, Wallet, AlertCircle, Info } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string;
  nft_contract_address: string;
  admin_wallet_id: string;
}

interface User {
  id: string;
  id: string;
  full_name: string;
  avatar_url: string;
  wallet_address: string;
  headline?: string;
}

// ABI for a basic ERC721 contract
const ERC721_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function MintBadge() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adminAddress, setAdminAddress] = useState<string>('');

  useEffect(() => {
    fetchBadges();
  }, []);

  useEffect(() => {
    if (selectedBadge) {
      setAdminAddress(selectedBadge.admin_wallet_id);
    }
  }, [selectedBadge]);

  async function fetchBadges() {
    try {
      const { data: badgesData, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (badgesError) throw badgesError;
      setBadges(badgesData || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      setError('Failed to fetch badges');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers(badgeId: string) {
    try {
      const selectedBadge = badges.find(b => b.id === badgeId);
      if (!selectedBadge?.nft_contract_address) {
        setError('Selected badge does not have a contract address');
        return;
      }

      if (!selectedBadge?.admin_wallet_id) {
        setError('Selected badge does not have an admin wallet address');
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, headline, wallet_address')
        .not('wallet_address', 'is', null)
        .not('wallet_address', 'eq', '');

      if (usersError) throw usersError;
      
      // Filter out users with invalid wallet addresses and admin wallet address
      const validUsers = usersData?.filter(user => 
        user.wallet_address && 
        isValidAddress(user.wallet_address) &&
        user.wallet_address.toLowerCase() !== selectedBadge.admin_wallet_id.toLowerCase()
      ) || [];
      
      setUsers(validUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    }
  }

  async function mintBadge(user: User) {
    if (!selectedBadge) {
      setError('No badge selected');
      return;
    }

    if (!selectedBadge.nft_contract_address) {
      setError('Badge is missing contract address');
      return;
    }

    if (!user.wallet_address || !isValidAddress(user.wallet_address)) {
      setError('User does not have a valid wallet address');
      return;
    }

    if (!adminPrivateKey) {
      setError('Admin private key is not configured');
      return;
    }

    setSelectedUser(user);
    setMinting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create contract instance
      const contract = new web3.eth.Contract(
        ERC721_ABI as any,
        selectedBadge.nft_contract_address
      );

      // Generate a unique token ID based on timestamp and user ID
      const timestamp = Date.now();
      const userIdHash = web3.utils.sha3(user.id) || '';
      const tokenId = web3.utils.toBigInt(
        web3.utils.sha3(timestamp.toString() + userIdHash.slice(2, 10)) || '0x1'
      );

      // Create the mint transaction
      const mintTx = contract.methods.mint(adminAddress, tokenId);
      
      // Get current gas price with a small buffer
      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceWithBuffer = BigInt(gasPrice) * BigInt(120) / BigInt(100); // 20% buffer
      
      // Estimate gas for the transaction
      let gas;
      try {
        gas = await mintTx.estimateGas({ from: adminAddress});
      } catch (error) {
        console.error('Gas estimation error:', error);
        gas = 200000; // Fallback gas limit
      }
      
      // Sign the transaction
      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: selectedBadge.nft_contract_address,
          data: mintTx.encodeABI(),
          gas,
          gasPrice: gasPriceWithBuffer.toString(),
          nonce: await web3.eth.getTransactionCount(adminAddress),
        },
        adminPrivateKey
      );

      if (!signedTx.rawTransaction) {
        throw new Error('Failed to sign transaction');
      }

      // Send the signed transaction
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      // Record the badge assignment in the database
      const { error: assignmentError } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: selectedBadge.id,
          awarded_at: new Date().toISOString(),
          token_id: tokenId.toString(),
          transaction_hash: receipt.transactionHash
        });

      if (assignmentError) throw assignmentError;

      setSuccess(`Successfully minted badge to ${user.full_name}! Transaction hash: ${receipt.transactionHash.slice(0, 10)}...`);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error in badge minting:', error);
      setError(error.message || 'Failed to mint badge');
    } finally {
      setMinting(false);
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow-lg animate-fade-in">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow-lg animate-fade-in">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-green-700">{success}</p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Wallet Info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-800">Admin Wallet Information</h3>
            <p className="text-sm text-blue-700 mt-1">
              Connected to Sepolia testnet using admin wallet: 
              <span className="font-mono ml-1">
                {adminAddress ? `${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}` : 'Not connected'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Select Badge to Mint</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {badges.length > 0 ? (
            badges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => {
                  setSelectedBadge(badge);
                  fetchUsers(badge.id);
                }}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all
                  ${selectedBadge?.id === badge.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center space-x-3">
                  {badge.image_url ? (
                    <img
                      src={badge.image_url}
                      alt={badge.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <Award className="w-12 h-12 text-blue-500" />
                  )}
                  <div>
                    <h3 className="font-medium">{badge.name}</h3>
                    <p className="text-sm text-gray-500">{badge.description}</p>
                    {badge.nft_contract_address ? (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        Contract: {badge.nft_contract_address.slice(0, 6)}...{badge.nft_contract_address.slice(-4)}
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 mt-1">
                        No contract address set
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No badges found. Create badges in the Badge Management section first.
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      {selectedBadge && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">Mint {selectedBadge.name}</h3>
              <button
                onClick={() => {
                  setSelectedBadge(null);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg ${
                    selectedUser?.id === user.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      src={user.avatar_url}
                      alt={user.full_name}
                      size="sm"
                    />
                    <div>
                      <span className="font-medium">{user.full_name}</span>
                      {user.headline && (
                        <p className="text-sm text-gray-500">{user.headline}</p>
                      )}
                      <p className="text-xs text-gray-400 font-mono">
                        Wallet: {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => mintBadge(user)}
                    disabled={minting && selectedUser?.id === user.id}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      minting && selectedUser?.id === user.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {minting && selectedUser?.id === user.id ? (
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Minting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        Mint Badge
                      </div>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users found with valid wallet addresses
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
