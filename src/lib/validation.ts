import { z } from 'zod';

// Authentication validation schemas
export const authSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be less than 128 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
});

// Wallet password schema (less strict for backwards compatibility)
export const walletPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be less than 128 characters' }),
  confirmPassword: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be less than 128 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Transaction validation schema
export const transactionSchema = z.object({
  recipient: z.string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address format' }),
  amount: z.string()
    .trim()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    })
    .refine((val) => parseFloat(val) <= 1000000000, {
      message: 'Amount is too large',
    }),
});

// Mnemonic validation schema
export const mnemonicSchema = z.object({
  mnemonic: z.string()
    .trim()
    .refine((val) => {
      const words = val.split(/\s+/);
      return words.length === 12 || words.length === 24;
    }, {
      message: 'Mnemonic must be 12 or 24 words',
    })
    .refine((val) => {
      // Check for valid characters (lowercase letters and spaces only)
      return /^[a-z\s]+$/.test(val);
    }, {
      message: 'Mnemonic must contain only lowercase letters and spaces',
    }),
});

// Private key validation schema
export const privateKeySchema = z.object({
  privateKey: z.string()
    .trim()
    .regex(/^(0x)?[a-fA-F0-9]{64}$/, {
      message: 'Invalid private key format',
    }),
});

// Payment webhook validation schema (for edge function)
export const paymentWebhookSchema = z.object({
  email: z.string()
    .email({ message: 'Invalid email address' })
    .max(255),
  tier_id: z.number()
    .int({ message: 'Tier ID must be an integer' })
    .positive({ message: 'Tier ID must be positive' }),
  payment_amount_usd: z.number()
    .positive({ message: 'Payment amount must be positive' })
    .max(1000000, { message: 'Payment amount is too large' }),
  transaction_id: z.string()
    .trim()
    .min(1, { message: 'Transaction ID is required' })
    .max(255, { message: 'Transaction ID is too long' }),
  timestamp: z.number()
    .int()
    .positive()
    .optional(),
});
