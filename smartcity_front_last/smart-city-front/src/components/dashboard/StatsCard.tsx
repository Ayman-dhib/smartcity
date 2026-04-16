

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  trendLabel?: string;
}

export default function StatsCard({ title, value, icon: Icon, trend, trendLabel }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
          <Icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
      </div>
    </div>
  );
}