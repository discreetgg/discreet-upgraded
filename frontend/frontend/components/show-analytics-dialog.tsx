import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Icon } from './ui/icons';

export const ShowAnalyticsModal = () => {
  return (
    <Dialog>
      <DialogTrigger className='gap-2 flex items-center text-[#8A8C95] font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-[15px] border-[#1F2227] rounded border'>
        Show Analytics
        <Icon.showAnalytics />
      </DialogTrigger>
      <DialogContent>Show Analytics</DialogContent>
    </Dialog>
  );
};
