import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfilePostsMediaContent } from './profile-posts-media-content';
import { ProfilePostsPostContent } from './profile-posts-post-content';

export const PublicProfilePostsSection = () => {
  return (
    <Tabs defaultValue='account' className='min-h-[45%] mt-[86px]'>
      <div className='border-b border-b-[#1E1E21] w-full justify-start rounded-none '>
        <TabsList className='bg-transparent h-auto gap-[30px] pb-0'>
          <TabsTrigger
            value='account'
            className="py-[14px] px-[17px] h-auto overflow-hidden bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-base font-medium max-w-[97px] border-none
		  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-[60%] after:h-[3px] after:bg-[#FF007F] after:left-[20%] 
		  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-0 after:translate-x-[150%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
          >
            10 Posts
          </TabsTrigger>
          <TabsTrigger
            value='password'
            className="py-[14px] px-[17px] h-auto overflow-hidden bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-base font-medium max-w-[97px] border-none
		  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-[60%] after:h-[3px] after:bg-[#FF007F] after:left-[20%] 
		  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-0 after:-translate-x-[150%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
          >
            40 Media
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value='account'
        className='h-full flex items-center justify-center'
      >
        <ProfilePostsPostContent />
      </TabsContent>
      <TabsContent
        value='password'
        className='h-full flex items-center justify-center'
      >
        <ProfilePostsMediaContent />
      </TabsContent>
    </Tabs>
  );
};
