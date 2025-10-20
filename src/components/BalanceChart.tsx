import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ChartDataPoint } from '@/types/wallet';

interface BalanceChartProps {
  data: ChartDataPoint[];
}

const BalanceChart = ({ data }: BalanceChartProps) => {
  const hasData = data.length > 1;
  const hoursTracked = data.length;
  
  return (
    <Card className="p-6 mx-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">24h Balance</h3>
        {hasData && hoursTracked < 24 && (
          <span className="text-xs text-muted-foreground">
            Tracking for {hoursTracked}h
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default BalanceChart;
