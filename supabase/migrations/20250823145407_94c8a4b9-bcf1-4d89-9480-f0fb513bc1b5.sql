-- Fix the check constraint for vault_movements type column to allow both deposit and withdrawal
ALTER TABLE vault_movements DROP CONSTRAINT IF EXISTS vault_movements_type_check;

-- Add the correct check constraint
ALTER TABLE vault_movements ADD CONSTRAINT vault_movements_type_check 
CHECK (type IN ('deposit', 'withdrawal'));