import Web3 from 'web3';

// Get provider URL from environment variables
const providerUrl = import.meta.env.VITE_ETHEREUM_PROVIDER_URL;
if (!providerUrl) {
  throw new Error('Missing Ethereum provider URL environment variable');
}

// Create Web3 instance with the provider
const provider = new Web3.providers.HttpProvider(providerUrl);
export const web3 = new Web3(provider);

// Get admin private key from environment variables
export const adminPrivateKey = import.meta.env.VITE_ADMIN_PRIVATE_KEY;
if (!adminPrivateKey) {
  throw new Error('Missing admin private key environment variable');
}

// Helper function to check if a wallet address is valid
export const isValidAddress = (address: string): boolean => {
  return Web3.utils.isAddress(address);
};

// Helper function to get admin wallet address from private key
export const getAdminAddress = (): string => {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(adminPrivateKey);
    return account.address;
  } catch (error) {
    console.error('Error getting admin address:', error);
    return '';
  }
};