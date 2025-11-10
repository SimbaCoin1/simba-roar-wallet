-- Remove user INSERT policy from custodial_balances table
-- Users should not be able to create their own balance records directly
DROP POLICY IF EXISTS "Users can insert their own balance" ON public.custodial_balances;

-- Balance initialization should only happen via the initialize-balance edge function
-- The service role will handle inserts through that function

-- Note: The following policies remain in place:
-- - Users can view their own balance (SELECT)
-- - Users can update their own balance (UPDATE)
-- - Admins can view all balances (SELECT)