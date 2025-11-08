-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add missing columns to investment_tiers
ALTER TABLE public.investment_tiers
ADD COLUMN IF NOT EXISTS daily_yield_percentage NUMERIC DEFAULT 0.0027,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add trigger for investment_tiers updated_at
CREATE TRIGGER update_investment_tiers_updated_at
  BEFORE UPDATE ON public.investment_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to custodial_transactions
ALTER TABLE public.custodial_transactions
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SBC',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update custodial_balances to have separate USD and SBC balances
ALTER TABLE public.custodial_balances
RENAME COLUMN balance TO sbc_balance;

ALTER TABLE public.custodial_balances
ADD COLUMN IF NOT EXISTS usd_balance NUMERIC DEFAULT 0;

-- Update RLS policies for admin access on user_investments
CREATE POLICY "Admins can view all investments"
  ON public.user_investments
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for admin access on daily_rewards
CREATE POLICY "Admins can view all rewards"
  ON public.daily_rewards
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for admin access on custodial_balances
CREATE POLICY "Admins can view all balances"
  ON public.custodial_balances
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for admin access on custodial_transactions
CREATE POLICY "Admins can view all transactions"
  ON public.custodial_transactions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));