'use client';

import type { CreatorSubscriptionsType } from '@/types/data';
import type { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { PlanType } from './plan-type';

export const settingsSubscriptionsColumns: ColumnDef<CreatorSubscriptionsType>[] =
  [
    {
      id: 'serialNumber',
      header: () => (
        <div className='text-[#3C3C42] font-medium text-[15px]'>S/N</div>
      ),
      cell: ({ row }) => (
        <span className='text-[#D4D4D8] font-medium text-[15px]'>
          {row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: 'username',
      header: () => (
        <div className='text-[#3C3C42] font-medium text-[15px]'>Account</div>
      ),
      cell: ({ row }) => {
        const { image, name, username, followers } = row.original;

        return (
          <div className='flex gap-3.5'>
            <Image
              src={image}
              height={41}
              width={41}
              className='rounded-full'
              alt=''
            />
            <div className='space-y-1.5'>
              <div className='flex items-center gap-1.5'>
                <span className='font-bold text-[15px]'>{name}</span>
                <span className='text-[#8A8C95] font-medium text-sm'>
                  @{username}
                </span>
              </div>
              <span className='text-[#8A8C95] font-light text-sm'>
                {followers}K Followers
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'subscriptionPlans',
      header: () => (
        <div className='text-[#3C3C42] font-medium text-[15px]'>
          Subscription Plans
        </div>
      ),
      cell: ({ row }) => {
        const { plan } = row.original;

        return <PlanType type={plan} />;
      },
    },
    {
      accessorKey: 'date',
      header: () => (
        <div className='text-[#3C3C42] font-medium text-[15px]'>Date</div>
      ),
      cell: ({ row }) => {
        const { date } = row.original;

        return (
          <span className='text-[#D4D4D8] font-light text-sm'>{date}</span>
        );
      },
    },
    {
      accessorKey: 'due',
      header: () => (
        <div className='text-[#3C3C42] font-medium text-[15px]'>Due</div>
      ),
      cell: ({ row }) => {
        const { due } = row.original;

        return <span className='text-[#D4D4D8] font-light text-sm'>{due}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: () => (
        <div className='text-[#3C3C42] font-medium text-[15px]'>Status</div>
      ),
      cell: ({ row }) => {
        const { status } = row.original;

        return (
          <span className='text-[#009947] font-light text-sm'>{status}</span>
        );
      },
    },
  ];
