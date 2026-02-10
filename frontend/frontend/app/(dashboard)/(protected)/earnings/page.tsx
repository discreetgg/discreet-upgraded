import { EarningSummary } from '@/components/earning-summary';
import { MyPayout } from '@/components/my-payout';
import { Icon } from '@/components/ui/icons';
import { getServerUser } from '@/lib/server-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { redirect } from 'next/navigation';

const Page = async () => {
  const user = await getServerUser();

  if (!user) {
    redirect('/auth?redirect=/earnings');
  }

  if (user.role !== 'seller') {
    redirect('/not-authorized');
  }

  return (
    <div className="py-6 px-2">
      <main className="relative md:pt-[88px] space-y-6">
        <div className="max-w-[413px] w-full space-y-1">
          <div className="flex items-center justify-between gap-3 md:mb-0 mb-2">
            <Image
              src="/logo.png"
              height={41}
              width={41}
              alt="logo"
              className="md:hidden"
            />
            <h1 className="md:text-[32px] text-[15px] font-semibold text-[#F8F8F8] ">
              Creator Earnings
            </h1>
            <div className="md:hidden" />
          </div>

          <p className="text-[#8A8C95]  font-light text-[15px] md:block hidden">
            Your control center to manage content, earnings, and interactions
            with your audience.
          </p>
        </div>

        <Tabs
          defaultValue="earning-summary"
          className="space-y-[31px] max-w-[791px]"
        >
          <TabsList className="bg-transparent  h-auto  p-0 -mb-[1px] gap-8">
            <TabsTrigger
              value="earning-summary"
              className="py-[16px] px-[0px] gap-2 h-auto rounded-none flex items-center overflow-hidden justify-start !w-full min-w-[170px] bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
            after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
            data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
            >
              <Icon.star className="[.tab[data-state=active]_&]:hidden" />
              <Icon.subscriptionActive className="[.tab[data-state=inactive]_&]:hidden" />
              Earning Summary
            </TabsTrigger>
            <TabsTrigger
              value="my-payout"
              className="py-[16px] px-[0px] gap-2 h-auto rounded-none overflow-hidden w-max flex-1 bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
            after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
            data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:-translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
            >
              <Icon.menu className="[.tab[data-state=active]_&]:hidden" />
              <Icon.menuActive className="[.tab[data-state=inactive]_&]:hidden" />
              My Payout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earning-summary">
            <EarningSummary />
          </TabsContent>
          <TabsContent value="my-payout">
            <MyPayout />
          </TabsContent>
        </Tabs>

        {/* <EarningsSetup /> */}
      </main>
    </div>
  );
};

export default Page;
