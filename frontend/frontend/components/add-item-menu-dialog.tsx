import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Icon } from './ui/icons';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export const AddItemMenuDialog = ({
  open,
  onOpenChange,
}: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='space-y-4'>
        <div className='flex gap-2 items-center'>
          <Icon.left />
          <span className='text-[15px] font-medium text-[#8A8C95] capitalize'>
            Back to Content Management
          </span>
        </div>
        <h2 className='text-3xl font-semibold text-[#F8F8F8]'>
          Add item to Menu
        </h2>
        <div className='py-8 px-4 rounded-2xl border w border-[#232323] bg-black'>
          <Input placeholder='Item title' />
          <Textarea placeholder='Item Details' />
        </div>
      </DialogContent>
    </Dialog>
  );
};
