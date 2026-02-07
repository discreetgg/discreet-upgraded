const MessagePageContent = () => {
  //   if (user) {
  //     return (
  //       <div className='relative h-full'>
  //         <MessageContainer
  //           senderId={user.discordId}
  //           receiver={tempReceiver}
  //           conversationId='' // Empty for temporary chat
  //         />
  //       </div>
  //     );
  //   }

  //   return (
  //     <div className='h-full flex items-center justify-center'>
  //       <div className='text-center'>
  //         <p className='text-muted-foreground'>User not found</p>
  //       </div>
  //     </div>
  //   );

  // Default empty state
  return <div className='relative h-full flex items-center justify-center' />;
};

export default MessagePageContent;
