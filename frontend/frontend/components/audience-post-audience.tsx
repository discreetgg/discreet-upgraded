import { AudiencePostAudienceAll } from './audience-post-audience-all';
import { AudiencePostAudienceViewAll } from './audience-post-audience-view-all';
import { Subscriber } from './subscriber';

export const AudiencePostAudience = () => {
  return (
    <div className='space-y-10'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg text-[#D4D4D8] font-medium'>Audience</h2>
        <div className='flex items-center gap-2'>
          <AudiencePostAudienceAll />
          <AudiencePostAudienceViewAll />
        </div>
      </div>
      <div className='space-8'>
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
      </div>
    </div>
  );
};
