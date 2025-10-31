-- Create investment tiers reference table
CREATE TABLE IF NOT EXISTS investment_tiers (
  id integer PRIMARY KEY,
  name text NOT NULL,
  price_usd numeric NOT NULL,
  seats integer NOT NULL,
  hashpower text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert the 5 tiers
INSERT INTO investment_tiers (id, name, price_usd, seats, hashpower) VALUES
  (1, 'Single Seat', 995, 1, '100mh/s'),
  (2, 'Triple Seats', 2985, 3, '300mh/s'),
  (3, 'Six Seats', 5970, 6, '600mh/s'),
  (4, 'Seven Seats', 6965, 7, '700mh/s'),
  (5, 'Eight Seats', 7960, 8, '800mh/s')
ON CONFLICT (id) DO NOTHING;

-- Create user investments table
CREATE TABLE IF NOT EXISTS user_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier_id integer REFERENCES investment_tiers(id) NOT NULL,
  investment_amount_usd numeric NOT NULL,
  seats integer NOT NULL,
  daily_yield_percentage numeric DEFAULT 0.0027 NOT NULL,
  purchase_date timestamptz DEFAULT now() NOT NULL,
  next_reward_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  payment_transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_investments
ALTER TABLE user_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investments"
  ON user_investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage investments"
  ON user_investments FOR ALL
  TO service_role
  USING (true);

-- Trigger for updated_at on user_investments
CREATE TRIGGER update_user_investments_updated_at
  BEFORE UPDATE ON user_investments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create daily rewards table
CREATE TABLE IF NOT EXISTS daily_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  investment_id uuid REFERENCES user_investments(id) ON DELETE CASCADE NOT NULL,
  reward_date date NOT NULL,
  investment_usd numeric NOT NULL,
  daily_yield_percentage numeric NOT NULL,
  sbc_price_usd numeric NOT NULL,
  usd_amount numeric NOT NULL,
  sbc_amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, reward_date)
);

-- Enable RLS on daily_rewards
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
  ON daily_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage rewards"
  ON daily_rewards FOR ALL
  TO service_role
  USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_date ON daily_rewards(user_id, reward_date DESC);

-- Create SBC price history table
CREATE TABLE IF NOT EXISTS sbc_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_usd numeric NOT NULL CHECK (price_usd > 0),
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'api', 'exchange')),
  notes text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Enable RLS on sbc_price_history
ALTER TABLE sbc_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage prices"
  ON sbc_price_history FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Anyone can view active price"
  ON sbc_price_history FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Function to get current active SBC price
CREATE OR REPLACE FUNCTION get_current_sbc_price()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT price_usd 
  FROM sbc_price_history 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
$$;

-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;