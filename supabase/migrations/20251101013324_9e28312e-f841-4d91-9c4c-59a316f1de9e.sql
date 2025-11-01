-- Enable RLS on investment_tiers (reference table)
ALTER TABLE investment_tiers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view investment tiers (read-only reference data)
CREATE POLICY "Anyone can view investment tiers"
  ON investment_tiers FOR SELECT
  TO authenticated
  USING (true);