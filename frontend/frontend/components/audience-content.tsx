import { AudiencePostAudience } from './audience-post-audience';
import { AudenceStat } from './audience-stat';
import { Separator } from './ui/separator';

export const AudienceContent = () => {
  return (
    <div className='p-8 rounded-lg border border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-10'>
      <AudenceStat />
      <Separator />
      <AudiencePostAudience />
    </div>
  );
};
