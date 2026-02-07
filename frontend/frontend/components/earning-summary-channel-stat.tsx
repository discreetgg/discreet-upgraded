'use client';

import {
  cn,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatEarningsAmount,
} from '@/lib/utils';
import { useEffect, useState } from 'react';
import { DatePicker } from './date-picker';
import { Source } from './earning-source';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { Separator } from './ui/separator';
import { useEarningsDate } from '@/hooks/filters/use-earnings-date';
import {
  useAllTimeEarnings,
  useMonthlyEarnings,
} from '@/hooks/mutations/use-earnings-mutation';
import { UserType } from '@/types/global';
import { Skeleton } from './ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { earningsByMonth } from '@/actions/earnings';
import { usePostPerformance } from '@/hooks/mutations/use-post-performance-mutation';
import { postPerformanceByMonth } from '@/actions/post';

interface Props {
  currentUser: UserType;
}

export const EarningSummaryChannelStat = ({ currentUser }: Props) => {
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const { earningDate } = useEarningsDate();
  const queryClient = useQueryClient();

  const { data: allTimeEarnings, isLoading: loadingAllTime } =
    useAllTimeEarnings(currentUser.discordId);

  const extractMonth = (date: Date) => {
    return (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  };

  const earningDates = {
    month: extractMonth(earningDate),
    year: earningDate.getFullYear().toString(),
  };

  const { data: postPerformance, isLoading: loadingPostPerformance } =
    usePostPerformance({
      discordId: currentUser.discordId,
      month: earningDates.month,
      year: earningDates.year,
    });

  // useEffect(() => {
  // 	console.log("Post Performance:", postPerformance);
  // }, [postPerformance]);
  const { data: monthlyEarnings, isLoading: loadingMonthly } =
    useMonthlyEarnings({
      discordId: currentUser.discordId,
      month: earningDates.month,
      year: earningDates.year,
    });

  const postMonthMutation = useMutation({
    mutationFn: async () => {
      return await postPerformanceByMonth({
        discordId: currentUser.discordId,
        month: earningDates.month,
        year: earningDates.year,
      });
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['post__performance', currentUser.discordId],
      });
    },
  });
  const earningsMonthMutation = useMutation({
    mutationFn: async () => {
      return await earningsByMonth({
        discordId: currentUser.discordId,
        month: earningDates.month,
        year: earningDates.year,
      });
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['monthly__earnings', currentUser.discordId],
      });
    },
  });

  useEffect(() => {
    earningsMonthMutation.mutate();
    postMonthMutation.mutate();
  }, [earningDate]);

  const monthlyLoadingOrMutating =
    loadingMonthly || earningsMonthMutation.isPending;
  return (
    <div className="p-8 rounded-lg border  border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21]">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-[#D4D4D8] font-medium">
            Earning summary
          </h2>
          <div className="flex gap-2 items-center">
            <DatePicker />
            <Button
              variant="ghost"
              onClick={() => setViewAllOpen((prev) => !prev)}
              className="gap-2 flex items-center text-[#8A8C95] font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-[15px] border-[#1F2227] bg-transparent h-auto rounded border"
            >
              View{viewAllOpen ? ' less' : ' all'}
              <Icon.viewAll
                className={
                  viewAllOpen
                    ? 'rotate-90 duration-200'
                    : ' rotate-0 duration-200'
                }
              />
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="max-w-[280px] space-y-1">
            <p className="text-[15px] text-[#8A8C95] capitalize">
              All time earning
            </p>
            {loadingAllTime ? (
              <Skeleton className="w-20 h-8 animate-pulse" />
            ) : (
              <div className="flex gap-1 items-end">
                <span className="md:text-3xl text-[#F8F8F8] font-semibold">
                  {formatEarningsAmount(
                    String(allTimeEarnings?.totalEarnings ?? '0')
                  )}
                </span>
                <span className="text-[15px] text-[#8A8C95] font-light pb-0.5">
                  USD
                </span>
              </div>
            )}
          </div>
          <div className="max-w-[280px] space-y-1">
            <p className="text-[15px] text-[#8A8C95] capitalize">
              {formatDate(earningDate)} earning
            </p>
            {monthlyLoadingOrMutating ? (
              <Skeleton className="w-20 h-8 animate-pulse" />
            ) : (
              <div className="flex gap-1 items-end">
                <span className="md:text-3xl text-[#F8F8F8] font-semibold">
                  {' '}
                  {formatEarningsAmount(
                    String(monthlyEarnings?.totalMonthlyEarnings ?? '0')
                  )}
                </span>
                <span className="text-[15px] text-[#8A8C95] font-light pb-0.5">
                  USD
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'transition-[max-height] duration-500 overflow-hidden space-y-8 ease-out',
          viewAllOpen ? 'max-h-[1000px]' : 'max-h-0'
        )}
      >
        <Separator className="mt-8" />
        <div className="space-y-8">
          <h2 className="text-lg text-[#D4D4D8]">
            Earnings Breakdown by Source - {formatDate(earningDate)}
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-8">
            <Source
              amount={formatEarningsAmount(
                String(monthlyEarnings?.breakdown?.MENU_PURCHASE ?? '0')
              )}
              currency="USD"
              title="Content sales"
              metric="23% increase - last month"
              isLoading={monthlyLoadingOrMutating}
            />
            <Source
              amount={formatEarningsAmount(
                String(monthlyEarnings?.breakdown?.TIP ?? '0')
              )}
              currency="USD"
              title="Tips and Donation"
              metric="23% increase - last month"
              isLoading={monthlyLoadingOrMutating}
            />

            {/* <Source
							amount="3k"
							currency="USD"
							title="Content sales"
							metric="23% increase - last month"
							/> */}
          </div>
        </div>
        <div className="space-y-8">
          <h2 className="text-lg text-[#D4D4D8]">
            Content Performance - {formatDate(earningDate)}
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-8">
            <Source
              amount={formatCompactNumber(postPerformance?.totalPosts ?? 0, 0)}
              currency="Posts"
              title="Total Posts"
              metric="23% increase - last month"
              isLoading={loadingPostPerformance}
            />
            <Source
              amount={formatCompactNumber(postPerformance?.totalLikes ?? 0, 0)}
              currency="Likes"
              title="Total Likes"
              metric="23% increase - last month"
              isLoading={loadingPostPerformance}
            />
            <Source
              amount={formatCompactNumber(
                postPerformance?.totalComments ?? 0,
                0
              )}
              currency="Comments"
              title="Total Comments"
              metric="23% increase - last month"
              isLoading={loadingPostPerformance}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
