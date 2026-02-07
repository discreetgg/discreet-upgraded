'use client';

import { Icon } from '@/components/ui/icons';
import type { UserType } from '@/types/global';
import Image from 'next/image';
import Link from 'next/link';
import { CamsSetCamAndPriceDialog } from '@/components/cams-set-cam-and-price-dialog';
import React from 'react';
import { CamsConnectDialog } from '../cams-connect';

interface CamCardProps {
  creator: UserType;
  isCurrentUser: boolean;
}

export const CamCard = ({ creator, isCurrentUser }: CamCardProps) => {
  const [isConnectOpen, setIsConnectOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  return (
    <React.Fragment key={creator.discordId}>
      <div
        onClick={() => {
          if (!isCurrentUser) {
            setIsConnectOpen(true);
          }
        }}
        className="rounded-[8.13px] hover:border-[#FF007F] border-[1.016px] border-[#1E1E21] relative overflow-hidden h-[224.603px] block transition-all"
      >
        <div className="z-10 absolute bottom-3 px-3 py-2.5 mt-auto w-full">
          <span className="flex items-center justify-between w-full">
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-medium">
                {creator.displayName}
              </span>
              <div className="size-[8px] rounded-full bg-[#32D583]" />
            </span>
            <span className="flex items-center gap-3 text-xs rounded-full bg-[#000000BA] px-2 py-1">
              <span className="flex items-center gap-1 text-[#FF007F]">
                <Icon.camVideo color="#000" className="size-[16.261px]" />
                <span>
                  ${creator?.callRate ? creator.callRate : '0'}
                  <span className="text-white">
                    /{creator?.callRate < 1 ? 'min' : 'mins'}
                  </span>
                </span>
              </span>
            </span>
          </span>
        </div>
        <div className="">
          <div className="absolute inset-0">
            {isCurrentUser && (
              <CamsSetCamAndPriceDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                data={{
                  rate: creator?.callRate,
                  minimumCallTime: creator?.minimumCallTime,
                  takingCams: creator?.takingCams || false,
                  takingCalls: creator?.takingCalls || false,
                }}
              >
                <button
                  type="button"
                  className="text-[#FF007F] text-[15px] absolute right-2 top-2 font-medium bg-gray-500/30 px-2 py-1 rounded-lg z-20"
                >
                  Edit
                </button>
              </CamsSetCamAndPriceDialog>
            )}
            <Image
              src={
                creator?.profileImage?.url ??
                (`https://cdn.discordapp.com/avatars/${creator.discordId}/${creator.discordAvatar}.png` ||
                  '/user.svg')
              }
              height={302.035}
              width={453.272}
              className="object-cover aspect-[302.03/453.27] h-full w-full"
              alt=""
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.00)_5.81%,#000_58.63%)] opacity-85" />
          </div>
        </div>
      </div>

      <CamsConnectDialog
        open={isConnectOpen}
        onOpenChange={(open) => setIsConnectOpen(open)}
        user={creator}
      />
    </React.Fragment>
  );
};
