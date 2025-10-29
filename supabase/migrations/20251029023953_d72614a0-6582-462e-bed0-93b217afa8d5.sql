-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create custodial_balances table
CREATE TABLE public.custodial_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custodial_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custodial_balances
CREATE POLICY "Users can view their own balance" 
ON public.custodial_balances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance" 
ON public.custodial_balances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance" 
ON public.custodial_balances 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create custodial_transactions table
CREATE TABLE public.custodial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'credit')),
  amount DECIMAL(20, 8) NOT NULL,
  blockchain_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custodial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custodial_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.custodial_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.custodial_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custodial_balance_timestamp
BEFORE UPDATE ON public.custodial_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();