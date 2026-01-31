export type Granularity = 'day' | 'week' | 'month';
export type GroupBy = 'agency' | 'violation' | 'location' | 'mvType' | 'gender';

export interface AnalyticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  agency?: string;
  violation?: string;
  placeOfApprehension?: string;
}

// Trends
export interface TrendsFilters extends AnalyticsFilters {
  granularity: Granularity;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface TrendsResponse {
  granularity: Granularity;
  series: TrendDataPoint[];
}

// Distributions
export interface DistributionsFilters extends AnalyticsFilters {
  groupBy: GroupBy;
  limit?: number;
}

export interface DistributionItem {
  label: string;
  count: number;
}

export interface DistributionsResponse {
  groupBy: GroupBy;
  items: DistributionItem[];
  total: number;
}

// Time Patterns
export interface HourCount {
  hour: number;
  count: number;
}

export interface DayOfWeekCount {
  day: number;
  label: string;
  count: number;
}

export interface TimePatternsResponse {
  byHour: HourCount[];
  byDayOfWeek: DayOfWeekCount[];
}

// Summary
export interface SummaryFilters {
  dateFrom?: Date;
  dateTo?: Date;
  comparePrevious?: boolean;
}

export interface PeriodStats {
  total: number;
  period: {
    from: string;
    to: string;
  };
}

export interface GrowthStats {
  absolute: number;
  percentage: number;
}

export interface SummaryResponse {
  current: PeriodStats;
  previous?: PeriodStats;
  growth?: GrowthStats;
}
