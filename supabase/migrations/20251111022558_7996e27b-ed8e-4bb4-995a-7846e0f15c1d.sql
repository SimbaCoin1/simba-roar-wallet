-- Remove the UPDATE policy that allows users to directly modify their balances
-- This prevents users from giving themselves unlimited funds via browser console
DROP POLICY IF EXISTS "Users can update their own balance" ON public.custodial_balances;

-- Balances should only be updated via:
-- 1. Edge functions (credit-balance, debit-balance)
-- 2. Daily rewards processing (service role)
-- 3. Admin operations (service role)