import { ContentCreatorAddPostDialog } from '@/components/content-creator-add-post-dialog';
import { ContentCreatorMenuContent } from '@/components/content-creator-menu-content';
import { PerformanceContent } from '@/components/performance-content';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Page = () => {
  return (
    <div className='py-6'>
      <main className='relative pt-[88px] space-y-6'>
        <div className='max-w-[413px] w-full space-y-1'>
          <h1 className='text-3xl font-semibold text-[#F8F8F8] '>
            Content Center
          </h1>
          <p className='text-[#8A8C95]  font-light text-[15px] '>
            Your control center to manage content, earnings, and interactions
            with your audience.
          </p>
        </div>
        <Tabs
          defaultValue='performance'
          className='space-y-[31px] max-w-[791px]'
        >
          <div className='flex items-center justify-between'>
            <TabsList className='bg-transparent  h-auto  p-0 -mb-[1px] gap-8'>
              <TabsTrigger
                value='performance'
                className="py-[16px] px-[0px] gap-2 h-auto rounded-none flex items-center overflow-hidden justify-start !w-full min-w-[121px] bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
                  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
                  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
              >
                <Icon.performance className='[.tab[data-state=active]_&]:hidden' />
                <Icon.performanceActive className='[.tab[data-state=inactive]_&]:hidden' />
                Performance
              </TabsTrigger>
              <TabsTrigger
                value='menu'
                className="py-[16px] px-[0px] gap-2 h-auto rounded-none overflow-hidden w-max flex-1 bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
                  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
                  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:-translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
              >
                <Icon.menu className='[.tab[data-state=active]_&]:hidden' />
                <Icon.menuActive className='[.tab[data-state=inactive]_&]:hidden' />
                Menu
              </TabsTrigger>
            </TabsList>
            {/* <ContentCreatorAddItem /> */}
            <ContentCreatorAddPostDialog>
              <Button className='gap-2 flex items-center font-medium px-4 py-2 shadow-[2px_2px_0_0_#FF007F] text-[15px] border-[#FF007F] bg-[#0A0A0A] rounded border'>
                Add
                <Icon.addItem />
              </Button>
            </ContentCreatorAddPostDialog>
          </div>

          <TabsContent value='performance'>
            <PerformanceContent />
          </TabsContent>
          <TabsContent value='menu'>
            <ContentCreatorMenuContent />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Page;
