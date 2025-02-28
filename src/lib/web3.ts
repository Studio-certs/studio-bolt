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
    // Validate private key format
    if (!adminPrivateKey || !/^[0-9a-fA-F]{64}$/.test(adminPrivateKey)) {
      throw new Error('Invalid admin private key format');
    }

    // Add 0x prefix if not present
    const privateKeyWithPrefix = adminPrivateKey.startsWith('0x') ? adminPrivateKey : `0x${adminPrivateKey}`;

    // Attempt to create account from private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKeyWithPrefix);
    
    // Validate the generated address
    if (!isValidAddress(account.address)) {
      throw new Error('Generated invalid wallet address');
    }

    return account.address;
  } catch (error) {
    console.error('Error getting admin address:', error);
    throw new Error('Invalid admin private key configuration');
  }
};

// Helper function to validate and format private key
export const validatePrivateKey = (privateKey: string): string => {
  if (!privateKey) {
    throw new Error('Private key is required');
  }

  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Check if key is valid hex string of correct length
  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    throw new Error('Invalid private key format');
  }

  return `0x${cleanKey}`;
};
