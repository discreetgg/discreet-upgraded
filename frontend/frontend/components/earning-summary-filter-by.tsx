'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Icon } from './ui/icons';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const statuses = ['Live', 'Suspended', 'Reviewed', 'Draft'];

const metricCategories = [
  'Likes',
  'Views',
  'Subscriptions',
  'Earnings',
  'Tips',
  'Comments',
];

export const EarningSummaryFilterBy = () => {
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = React.useState<
    Record<string, 'Highest' | 'Least' | null>
  >(
    metricCategories.reduce(
      (acc, metric) => {
        acc[metric] = null;
        return acc;
      },
      {} as Record<string, 'Highest' | 'Least' | null>
    )
  );

  const [open, setOpen] = React.useState(false);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status]
    );
  };

  const selectMetricOption = (metric: string, option: 'Highest' | 'Least') => {
    setSelectedMetrics((prev) => ({
      ...prev,
      [metric]: prev[metric] === option ? null : option,
    }));
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedMetrics(
      metricCategories.reduce(
        (acc, metric) => {
          acc[metric] = null;
          return acc;
        },
        {} as Record<string, 'Highest' | 'Least' | null>
      )
    );
  };

  const applyFilters = () => {
    setOpen(false);
  };

  const activeFilters = [
    ...Object.entries(selectedMetrics)
      .filter(([_, value]) => value)
      .map(([metric, value]) => `${value} ${metric}`),
    ...selectedStatuses,
  ].join(', ');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className='gap-2 flex items-center text-[#8A8C95] font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-[15px] border-[#1F2227] rounded border'>
        <span className='!max-w-[120px] truncate'>
          Filter by
          <span className='text-xs'>
            {activeFilters && `: ${activeFilters}`}
          </span>
        </span>
        <Icon.viewAll />
      </PopoverTrigger>

      <PopoverContent className='shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0 w-72'>
        <div className='flex flex-col p-3 space-y-5'>
          <div className='space-y-2'>
            <h4 className='text-[13px] text-[#8A8C95] uppercase'>Status</h4>
            <div className='space-y-1.5'>
              {statuses.map((status) => (
                // biome-ignore lint/a11y/noLabelWithoutControl: <explanation>
                <label
                  key={status}
                  className='flex items-center gap-2 text-white text-[14px] py-1.5 px-2 hover:bg-[#1F2227] rounded cursor-pointer'
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <h4 className='text-[13px] text-[#8A8C95] uppercase'>Sort By</h4>
            <div className='space-y-2'>
              {metricCategories.map((metric) => (
                <div key={metric} className='flex flex-col space-y-1'>
                  <span className='text-white text-[14px]'>{metric}</span>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => selectMetricOption(metric, 'Highest')}
                      className={`text-[13px] px-2 py-1 border rounded ${
                        selectedMetrics[metric] === 'Highest'
                          ? 'bg-[#1F2227] border-[#1F2227] text-white'
                          : 'text-[#8A8C95] border-[#1E1E21] hover:bg-[#1F2227]'
                      }`}
                    >
                      Highest
                    </button>
                    <button
                      type='button'
                      onClick={() => selectMetricOption(metric, 'Least')}
                      className={`text-[13px] px-2 py-1 border rounded ${
                        selectedMetrics[metric] === 'Least'
                          ? 'bg-[#1F2227] border-[#1F2227] text-white'
                          : 'text-[#8A8C95] border-[#1E1E21] hover:bg-[#1F2227]'
                      }`}
                    >
                      Least
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='flex justify-between gap-2 pt-1'>
            <Button
              size='sm'
              variant='ghost'
              onClick={clearFilters}
              className='text-[#8A8C95] text-[13px] px-3 py-1 border border-[#1E1E21] rounded'
            >
              Clear
            </Button>
            <Button
              size='sm'
              onClick={applyFilters}
              className='text-[13px] px-3 py-1 shadow-[2px_2px_0_0_#1F2227] border-[#1F2227] rounded border'
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
