import React from 'react'

export const Hero = ({
    type,
    lastUpdated,
}: {
    type: string;
    lastUpdated: string;
}) => {
  const getTitle = () => {
    if (type === "terms") return "Discreet Terms of \n Service";
    if (type === "privacy") return "Discreet Privacy \n Policy";
    if (type === "2257") return "18 U.S.C. 2257 \n Statement";
    return type;
  };

  return (
    <div className='flex flex-col items-start justify-center h-dvh max-h-[1000px] w-full text-[#737682] gap-y-5 max-w-7xl mx-auto px-6'>
      <h4 className='text-[40px] font-normal'>Last Updated: {lastUpdated}</h4>
      <h1 className=' text-[70px] font-bold  capitalize whitespace-pre-line '>{getTitle()}</h1>
    </div>
  );
}