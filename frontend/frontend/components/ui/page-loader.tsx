import { Icon } from './icons';

export const PageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] bg-black/10 backdrop-blur-sm h-screen w-screen inset-0">
      <Icon.logo className="text-white w-[62.473px] h-[50.392px] animate-[custom-ping_1.5s_ease-in-out_infinite]" />
    </div>
  );
};
