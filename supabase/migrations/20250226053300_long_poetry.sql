-- Add NFT contract related fields to badges table
ALTER TABLE badges
ADD COLUMN nft_contract_address TEXT,
ADD COLUMN admin_wallet_id TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_badges_nft_contract
ON badges(nft_contract_address);

-- Add helpful comment
COMMENT ON COLUMN badges.nft_contract_address IS 'The NFT contract address associated with this badge';
COMMENT ON COLUMN badges.admin_wallet_id IS 'The admin wallet ID that owns the NFT contract';
