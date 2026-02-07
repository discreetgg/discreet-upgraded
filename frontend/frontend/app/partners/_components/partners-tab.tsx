import { RefferalBoard } from '@/components/refferal-board';
import { MyPayout } from '@/components/my-payout';
import { Icon } from '@/components/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PartnersTab = () => {
  return (
    <div className=''>
        <Tabs
          defaultValue='invites'
          className='space-y-[31px] max-w-[791px]'
        >
          <TabsList className='bg-transparent  h-auto  p-0 mb-[24px] gap-8 !relative isolate'>
            <TabsTrigger
              value='invites'
              className="py-[16px] px-[0px] -z-10 gap-2 h-auto rounded-none flex items-center overflow-hidden justify-start !w-full min-w-[74px]  bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
            after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
            data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
            >
              <Icon.inviteInactive className='[.tab[data-state=active]_&]:hidden' />
              <Icon.invite className='[.tab[data-state=inactive]_&]:hidden' />
              Invites
            </TabsTrigger>
            <TabsTrigger
              value='my-payout'
              className="py-[16px] px-[0px] gap-2  min-w-[95px] h-auto rounded-none overflow-hidden w-max flex-1 bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
            after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
            data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:-translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
            >
              <Icon.payout className='[.tab[data-state=active]_&]:hidden' />
              <Icon.payoutActive className='[.tab[data-state=inactive]_&]:hidden' />
              My Payout
            </TabsTrigger>
          </TabsList>

          <TabsContent value='invites'>
            <RefferalBoard />
          </TabsContent>
          <TabsContent value='my-payout'>
            <MyPayout />
          </TabsContent>
        </Tabs>

        {/* <EarningsSetup /> */}
   
    </div>
  );
};

export default PartnersTab;
