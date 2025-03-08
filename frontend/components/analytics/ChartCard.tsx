import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type ChartType = 'line' | 'bar' | 'pie';

interface ChartCardProps {
  title: string;
  description?: string;
  data: any[];
  type: ChartType;
  dataKeys: string[];
  colors?: string[];
  xAxisKey?: string;
  isLoading?: boolean;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  data,
  type,
  dataKeys,
  colors = DEFAULT_COLORS,
  xAxisKey = 'name',
  isLoading = false,
  height = 300,
  showLegend = true,
  showGrid = true,
  className,
}) => {
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Skeleton className={`h-[${height - 50}px] w-full`} />
        </div>
      );
    }

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKeys[0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={`h-[${height}px]`}>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ChartCard; 