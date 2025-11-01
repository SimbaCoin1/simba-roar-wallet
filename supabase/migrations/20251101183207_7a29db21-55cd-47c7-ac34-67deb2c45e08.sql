-- Allow users to update their own investments (needed for test reward functionality)
CREATE POLICY "Users can update their own investments"
ON user_investments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);