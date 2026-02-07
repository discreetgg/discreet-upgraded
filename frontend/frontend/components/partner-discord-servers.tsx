import { partnerDiscordServers } from '@/lib/data';
import { InfiniteMovingCards } from './ui/infinite-moving-cards';
import Link from 'next/link';

export const PartnerDiscordServers = ({
  infiniteMovingCardsClassName,
}: {
  infiniteMovingCardsClassName?: string;
}) => {
  return (
    <div className="space-y-[26px]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Partner discord servers</h2>
        <Link href="/server" className="text-lg font-semibold hover:underline">
          View more
        </Link>
      </div>
      <div className="rounded-md flex flex-col items-start justify-start relative ">
        <InfiniteMovingCards
          items={partnerDiscordServers}
          direction="left"
          speed="slow"
          className={infiniteMovingCardsClassName}
        />
      </div>
    </div>
  );
};
