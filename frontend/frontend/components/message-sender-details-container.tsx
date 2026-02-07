'use client';

import { useMessage } from '@/context/message-context';
import { getUserByIdService } from '@/lib/services';
import type { UserType } from '@/types/global';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ComponentLoader } from './ui/component-loader';
import { PublicProfileHeaderSection } from './public-profile-header-section';
import { useAuth } from '@/context/auth-context-provider';

export const MessageSenderDetailsContainer = () => {
  const { receiver } = useMessage();
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await getUserByIdService(receiver?.discordId || '')
        .then((response) => {
          setUser(response?.data);
        })
        .catch((error) => {
          setUser(null);
          {
            isAuthenticated &&
              toast.error('Error fetching user data', {
                description: error?.message ?? 'Something went wrong.',
              });
          }
        })
        .finally(() => {
          setLoading(false);
        });
    })();
  }, [receiver]);

  if (loading) {
    return (
      <ComponentLoader className="flex items-center justify-center w-full" />
    );
  }

  return (
    <div className="border rounded-[14.41px] w-[311px]  overflow-hidden bg-[#0F1114] hover:bg-[#0F1114]/80">
      {user && (
        <PublicProfileHeaderSection
          user={user}
          bodyClassName="pb-4"
          showEditButton={false}
          className="w-full"
          isMessage
        />
      )}
    </div>
  );
};
