'use client';

export const MessageTypingIndicator = ({ username }: { username?: string }) => {
  return (
    <div className='flex items-center gap-2 p-3'>
      <div className='flex space-x-1'>
        <div className='w-2 h-2 bg-[#8A8C95] rounded-full animate-bounce' />
        <div
          className='w-2 h-2 bg-[#8A8C95] rounded-full animate-bounce'
          style={{ animationDelay: '0.1s' }}
        />
        <div
          className='w-2 h-2 bg-[#8A8C95] rounded-full animate-bounce'
          style={{ animationDelay: '0.2s' }}
        />
      </div>
      <span className='text-xs text-[#8A8C95]'>
        {username ? `${username} is typing...` : 'Typing...'}
      </span>
    </div>
  );
};
