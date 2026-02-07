export const PostsLoadingIndicator = () => {
  return (
    <div className="space-y-6 w-full">
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className="border-[#1E1E21] bg-background border shadow-[2px_2px_0_0_#1E1E21] p-4 rounded-[8px] space-y-4  w-full relative"
        >
          {/* Post header skeleton */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 bg-[#1E1E21] rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-[#1E1E21] rounded w-32 animate-pulse" />
                <div className="h-3 bg-[#1E1E21] rounded w-24 animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-8 bg-[#1E1E21] rounded-full animate-pulse" />
          </div>

          {/* Post content skeleton */}
          <div className="space-y-2 w-full">
            <div className="h-3 bg-[#1E1E21] rounded w-full animate-pulse" />
            <div className="h-3 bg-[#1E1E21] rounded w-5/6 animate-pulse" />
            <div className="h-3 bg-[#1E1E21] rounded w-4/6 animate-pulse" />
          </div>

          {/* Post actions skeleton */}
          <div className="flex items-center justify-between pt-2 w-full">
            <div className="flex items-center gap-4">
              <div className="h-6 w-6 bg-[#1E1E21] rounded animate-pulse" />
              <div className="h-6 w-6 bg-[#1E1E21] rounded animate-pulse" />
              <div className="h-6 w-6 bg-[#1E1E21] rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-[#1E1E21] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const PostsLoadMoreTrigger = ({
  isVisible = true,
}: { isVisible?: boolean }) => {
  // Always render the container to prevent layout shift/glitch for intersection observer
  return (
    <div className='flex justify-center py-4 min-h-[50px]'>
      {isVisible && (
        <div className='flex flex-col items-center gap-2'>
          <div className="h-6 w-6 border-2 border-[#FF007F] border-t-transparent rounded-full animate-spin"></div>
          {/* <div className='text-sm text-[#8A8C95]'>Loading more posts...</div> */}
        </div>
      )}
    </div>
  );
};
