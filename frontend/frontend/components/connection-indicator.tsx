'use client';

import { useSocket } from '@/context/socket-context';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

const getConnectionColor = (quality: ConnectionQuality): string => {
  switch (quality) {
    case 'excellent':
      return 'bg-green-500';
    case 'good':
      return 'bg-green-400';
    case 'fair':
      return 'bg-yellow-500';
    case 'poor':
      return 'bg-orange-500';
    case 'disconnected':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getConnectionLabel = (quality: ConnectionQuality): string => {
  switch (quality) {
    case 'excellent':
      return 'Excellent connection';
    case 'good':
      return 'Good connection';
    case 'fair':
      return 'Fair connection';
    case 'poor':
      return 'Poor connection';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
};

export const ConnectionIndicator = ({ className }: { className?: string }) => {
  const { connectionQuality, isConnected } = useSocket();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn('flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-[#1A1C1F] transition-colors', className)}
            aria-label={getConnectionLabel(connectionQuality)}
          >
            <div className="relative flex items-center">
              {/* Connection indicator dot */}
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-colors duration-300',
                  getConnectionColor(connectionQuality),
                  !isConnected && 'animate-pulse'
                )}
              />
              {/* Pulse ring for active connection */}
              {isConnected && connectionQuality !== 'disconnected' && (
                <div
                  className={cn(
                    'absolute w-2 h-2 rounded-full animate-ping',
                    getConnectionColor(connectionQuality),
                    'opacity-75'
                  )}
                />
              )}
            </div>
            {/* Connection bars indicator */}
            <div className="flex items-end gap-0.5 h-3">
              {connectionQuality === 'excellent' && (
                <>
                  <div className="w-0.5 h-1 bg-green-500 rounded" />
                  <div className="w-0.5 h-2 bg-green-500 rounded" />
                  <div className="w-0.5 h-2.5 bg-green-500 rounded" />
                  <div className="w-0.5 h-3 bg-green-500 rounded" />
                </>
              )}
              {connectionQuality === 'good' && (
                <>
                  <div className="w-0.5 h-1 bg-green-400 rounded" />
                  <div className="w-0.5 h-2 bg-green-400 rounded" />
                  <div className="w-0.5 h-2.5 bg-green-400 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                </>
              )}
              {connectionQuality === 'fair' && (
                <>
                  <div className="w-0.5 h-1 bg-yellow-500 rounded" />
                  <div className="w-0.5 h-2 bg-yellow-500 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                </>
              )}
              {connectionQuality === 'poor' && (
                <>
                  <div className="w-0.5 h-1 bg-orange-500 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                </>
              )}
              {connectionQuality === 'disconnected' && (
                <>
                  <div className="w-0.5 h-1 bg-red-500 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                  <div className="w-0.5 h-1 bg-gray-500 rounded" />
                </>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getConnectionLabel(connectionQuality)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
