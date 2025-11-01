import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Gift } from "lucide-react";

interface Reward {
  id: string;
  reward_date: string;
  sbc_amount: number;
  usd_amount: number;
  sbc_price_usd: number;
}

interface RewardsHistoryProps {
  rewards: Reward[];
  totalEarned: number;
}

export const RewardsHistory = ({ rewards, totalEarned }: RewardsHistoryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Rewards History
        </CardTitle>
        <CardDescription>
          Total earned: {totalEarned.toFixed(2)} SBC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No rewards yet. Your first reward will arrive after your next reward date.
            </p>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(reward.reward_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SBC @ ${Number(reward.sbc_price_usd).toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +{Number(reward.sbc_amount).toFixed(2)} SBC
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${Number(reward.usd_amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
