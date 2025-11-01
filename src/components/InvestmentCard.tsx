import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap } from "lucide-react";

interface InvestmentCardProps {
  investment: {
    tier?: { name: string; hashpower: string };
    investment_amount_usd: number;
    seats: number;
    daily_yield_percentage: number;
    purchase_date: string;
    next_reward_date: string;
  };
  projectedDaily: { usd: number; sbc: number } | null;
}

export const InvestmentCard = ({ investment, projectedDaily }: InvestmentCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {investment.tier?.name || 'Investment Plan'}
          </CardTitle>
          <Badge variant="secondary">{investment.seats} Seats</Badge>
        </div>
        <CardDescription>{investment.tier?.hashpower || 'Hash Power'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Investment</p>
          <p className="text-2xl font-bold">${investment.investment_amount_usd.toLocaleString()}</p>
        </div>

        {projectedDaily && (
          <div className="p-3 bg-primary/5 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Estimated Daily Reward</p>
            </div>
            <p className="text-lg font-bold">
              {projectedDaily.sbc.toFixed(2)} SBC
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Next reward: {new Date(investment.next_reward_date).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};
