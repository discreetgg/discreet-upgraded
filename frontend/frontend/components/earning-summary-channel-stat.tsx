'use client';

import { useWalletTransaction } from '@/hooks/mutations/use-wallet-transaction';
import { cn } from '@/lib/utils';
import { UserType } from '@/types/global';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotProps,
  type TooltipProps,
} from 'recharts';
import { Skeleton } from './ui/skeleton';

interface Props {
  currentUser: UserType;
}

type TimeRange = '1D' | '7D' | '30D' | 'ALL';

type TimeRangeOption = {
  value: TimeRange;
  label: string;
  days: number | null;
};

type NormalizedEarningTransaction = {
  createdAt: Date;
  amount: number;
};

type ChartPoint = {
  timestamp: number;
  dateKey: string;
  dateLabel: string;
  fullDateLabel: string;
  dailyEarnings: number;
  cumulativeEarnings: number;
  hasEarnings: boolean;
};

type BaseChartPoint = Omit<ChartPoint, 'cumulativeEarnings'>;

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '1D', label: '1D', days: 1 },
  { value: '7D', label: '7D', days: 7 },
  { value: '30D', label: '30D', days: 30 },
  { value: 'ALL', label: 'All-time', days: null },
];

const startOfLocalDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatChartDate = (date: Date, includeYear = false) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });

const formatUsd = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);

const formatCompactUsd = (value: number) => {
  if (value === 0) {
    return '$0';
  }

  return `$${new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)}`;
};

const buildFlatPoints = (startDate: Date, endDate: Date): BaseChartPoint[] => {
  const points: BaseChartPoint[] = [];
  const cursor = new Date(startDate);

  while (cursor.getTime() <= endDate.getTime()) {
    const currentDate = new Date(cursor);
    points.push({
      timestamp: currentDate.getTime(),
      dateKey: toDateKey(currentDate),
      dateLabel: formatChartDate(currentDate),
      fullDateLabel: formatChartDate(currentDate, true),
      dailyEarnings: 0,
      hasEarnings: false,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
};

const getRangeStart = (
  range: TimeRange,
  allTimePoints: BaseChartPoint[],
  today: Date
) => {
  const selectedOption = TIME_RANGE_OPTIONS.find((option) => option.value === range);

  if (!selectedOption || selectedOption.days === null) {
    return allTimePoints.length
      ? new Date(allTimePoints[0].timestamp)
      : startOfLocalDay(today);
  }

  const rangeStart = startOfLocalDay(today);
  rangeStart.setDate(rangeStart.getDate() - (selectedOption.days - 1));
  return rangeStart;
};

const useCountUpValue = (targetValue: number, duration = 850) => {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const previousTarget = useRef(targetValue);

  useEffect(() => {
    const fromValue = previousTarget.current;
    const valueDelta = targetValue - fromValue;

    if (Math.abs(valueDelta) < 0.01) {
      setDisplayValue(targetValue);
      previousTarget.current = targetValue;
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const nextValue = fromValue + valueDelta * easedProgress;

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      previousTarget.current = targetValue;
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [duration, targetValue]);

  return displayValue;
};

const EarningsTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#1E1E21] bg-[#0F1114] px-3 py-2 shadow-lg">
      <p className="text-xs text-[#8A8C95]">{point.fullDateLabel}</p>
      <p className="text-sm font-medium text-[#F8F8F8]">
        Total: {formatUsd(point.cumulativeEarnings)}
      </p>
      {point.hasEarnings && (
        <p className="text-xs text-[#FF7ABF]">
          Earned: {formatUsd(point.dailyEarnings)}
        </p>
      )}
    </div>
  );
};

const renderEarningsDot = (props: DotProps & { payload?: ChartPoint }) => {
  const { cx, cy, payload } = props;

  if (typeof cx !== 'number' || typeof cy !== 'number') {
    return <circle cx={0} cy={0} r={0} fill="none" stroke="none" />;
  }

  if (!payload?.hasEarnings) {
    return <circle cx={cx} cy={cy} r={0} fill="none" stroke="none" />;
  }

  return <circle cx={cx} cy={cy} r={3.5} fill="#FF007F" stroke="#0F1114" strokeWidth={2} />;
};

export const EarningSummaryChannelStat = ({ currentUser }: Props) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('ALL');
  const { data: walletTransactions, isLoading } = useWalletTransaction(
    currentUser.discordId,
    5000
  );

  const earningTransactions = useMemo<NormalizedEarningTransaction[]>(() => {
    if (!walletTransactions?.length) {
      return [];
    }

    return walletTransactions
      .filter(
        (transaction) =>
          transaction.type === 'CREDIT' && transaction.status === 'COMPLETED'
      )
      .map((transaction) => ({
        createdAt: new Date(transaction.createdAt),
        amount: Number(transaction.amount) || 0,
      }))
      .filter(
        (transaction) =>
          !Number.isNaN(transaction.createdAt.getTime()) && transaction.amount > 0
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [walletTransactions]);

  const allTimePoints = useMemo<BaseChartPoint[]>(() => {
    if (!earningTransactions.length) {
      return [];
    }

    const dailyTotals = new Map<string, number>();

    for (const transaction of earningTransactions) {
      const day = startOfLocalDay(transaction.createdAt);
      const dayKey = toDateKey(day);
      const currentTotal = dailyTotals.get(dayKey) ?? 0;
      dailyTotals.set(dayKey, currentTotal + transaction.amount);
    }

    const today = startOfLocalDay(new Date());
    const firstDay = startOfLocalDay(earningTransactions[0].createdAt);
    const points: BaseChartPoint[] = [];
    const cursor = new Date(firstDay);

    while (cursor.getTime() <= today.getTime()) {
      const currentDay = new Date(cursor);
      const dayKey = toDateKey(currentDay);
      const dailyEarnings = dailyTotals.get(dayKey) ?? 0;

      points.push({
        timestamp: currentDay.getTime(),
        dateKey: dayKey,
        dateLabel: formatChartDate(currentDay),
        fullDateLabel: formatChartDate(currentDay, true),
        dailyEarnings,
        hasEarnings: dailyEarnings > 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return points;
  }, [earningTransactions]);

  const selectedRangeData = useMemo(() => {
    const today = startOfLocalDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rangeStart = getRangeStart(selectedRange, allTimePoints, today);
    const rangeStartTimestamp = rangeStart.getTime();
    const tomorrowTimestamp = tomorrow.getTime();

    const rangeBasePoints = allTimePoints.filter(
      (point) => point.timestamp >= rangeStartTimestamp
    );

    const pointsForRange = rangeBasePoints.length
      ? rangeBasePoints
      : buildFlatPoints(rangeStart, today);

    let runningTotal = 0;
    const points: ChartPoint[] = pointsForRange.map((point) => {
      runningTotal += point.dailyEarnings;
      return {
        ...point,
        cumulativeEarnings: runningTotal,
      };
    });

    const rangeTransactions = earningTransactions.filter(
      (transaction) =>
        transaction.createdAt.getTime() >= rangeStartTimestamp &&
        transaction.createdAt.getTime() < tomorrowTimestamp
    );

    const bestDay = points.reduce(
      (maxValue, point) => Math.max(maxValue, point.dailyEarnings),
      0
    );

    return {
      points,
      total: points[points.length - 1]?.cumulativeEarnings ?? 0,
      earningDays: points.filter((point) => point.hasEarnings).length,
      transactionCount: rangeTransactions.length,
      bestDay,
    };
  }, [allTimePoints, earningTransactions, selectedRange]);

  const allTimeTotal = useMemo(
    () =>
      earningTransactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
      ),
    [earningTransactions]
  );

  const activeRangeLabel = useMemo(
    () =>
      TIME_RANGE_OPTIONS.find((rangeOption) => rangeOption.value === selectedRange)
        ?.label ?? 'All-time',
    [selectedRange]
  );

  const animatedTotal = useCountUpValue(selectedRangeData.total);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#1E1E21] p-8 shadow-[4px_4px_0_0_#1E1E21]">
        <div className="space-y-4">
          <Skeleton className="h-5 w-28 animate-pulse" />
          <Skeleton className="h-11 w-52 animate-pulse" />
          <Skeleton className="h-[260px] w-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#1E1E21] bg-[#0B0D10] p-6 md:p-8 shadow-[4px_4px_0_0_#1E1E21]">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#8A8C95]">
            Earnings ({activeRangeLabel})
          </p>
          <div className="flex items-end gap-2">
            <span className="text-[34px] leading-none font-semibold text-[#F8F8F8] tabular-nums md:text-[42px]">
              {formatUsd(animatedTotal)}
            </span>
            <span className="pb-1 text-sm text-[#8A8C95]">USD</span>
          </div>
          <p className="text-xs text-[#8A8C95] md:text-sm">
            All-time total:{' '}
            <span className="font-medium text-[#D4D4D8] tabular-nums">
              {formatUsd(allTimeTotal)}
            </span>
          </p>
        </div>

        <div className="inline-flex w-full items-center rounded-full border border-[#1F2227] bg-[#111317] p-1 md:w-auto">
          {TIME_RANGE_OPTIONS.map((rangeOption) => {
            const isActive = selectedRange === rangeOption.value;
            return (
              <button
                type="button"
                key={rangeOption.value}
                onClick={() => setSelectedRange(rangeOption.value)}
                className={cn(
                  'flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors md:flex-none',
                  isActive
                    ? 'bg-[#FF007F] text-white'
                    : 'text-[#8A8C95] hover:text-[#D4D4D8]'
                )}
              >
                {rangeOption.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 md:max-w-[520px]">
        <div className="rounded-lg border border-[#1F2227] bg-[#111317] px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-[#8A8C95]">
            Earning Days
          </p>
          <p className="mt-1 text-sm font-semibold text-[#F8F8F8] tabular-nums md:text-base">
            {selectedRangeData.earningDays}
          </p>
        </div>
        <div className="rounded-lg border border-[#1F2227] bg-[#111317] px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-[#8A8C95]">
            Events
          </p>
          <p className="mt-1 text-sm font-semibold text-[#F8F8F8] tabular-nums md:text-base">
            {selectedRangeData.transactionCount}
          </p>
        </div>
        <div className="rounded-lg border border-[#1F2227] bg-[#111317] px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-[#8A8C95]">
            Best Day
          </p>
          <p className="mt-1 text-sm font-semibold text-[#F8F8F8] tabular-nums md:text-base">
            {formatUsd(selectedRangeData.bestDay)}
          </p>
        </div>
      </div>

      <div className="mt-6 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={selectedRangeData.points}
            margin={{ top: 8, right: 10, left: 2, bottom: 6 }}
          >
            <CartesianGrid vertical={false} stroke="#1F2227" />
            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              minTickGap={20}
              tick={{ fill: '#8A8C95', fontSize: 12 }}
            />
            <YAxis
              width={72}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8A8C95', fontSize: 12 }}
              tickFormatter={(value) => formatCompactUsd(Number(value))}
            />
            <Tooltip
              cursor={{ stroke: '#FF007F', strokeWidth: 1, strokeOpacity: 0.2 }}
              content={<EarningsTooltip />}
            />
            <Line
              key={`${selectedRange}-${selectedRangeData.points.length}`}
              type="monotone"
              dataKey="cumulativeEarnings"
              stroke="#FF007F"
              strokeWidth={3}
              isAnimationActive
              animationDuration={750}
              animationEasing="ease-out"
              dot={renderEarningsDot}
              activeDot={{
                r: 5,
                fill: '#0F1114',
                stroke: '#FF007F',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-[#8A8C95]">
        Cumulative earnings only. The line stays flat on days without sales.
      </p>
    </div>
  );
};
