import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useGlobal } from '@/context/global-context-provider';
import Link from 'next/link';
import { Icon } from './ui/icons';
import { UserAvatar } from './user-avatar';

export const AppSidebarUser = () => {
  const { isMobile, state } = useSidebar();
  const { user, handleLogout } = useGlobal();

  const isSidebarOpen = state === 'expanded';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className='rounded-[10px] bg-[#16161A] w-max p-2.5 flex items-center gap-1'>
              <div
                data-show={isSidebarOpen}
                className='data-[show=false]:!flex-1'
              >
                <UserAvatar
                  profileImage={user?.profileImage?.url}
                  discordAvatar={user?.discordAvatar ?? ''}
                  discordId={user?.discordId ?? ''}
                  className='!size-[20.176px]'
                />
              </div>
              <span
                data-show={isSidebarOpen}
                className='text-xs text-[#8A8C95] font-light line-clamp-1 max-w-[100px] truncate hidden data-[show=true]:block'
              >
                @{user?.username}
              </span>
              <Icon.arrowDown data-show={isSidebarOpen} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <Link href='/profile'>
              <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
                <Icon.profile />
                Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className='my-0' />
            <Link href='/settings'>
              <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
                <Icon.settings />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className='my-0' />

            <DropdownMenuItem
              onClick={handleLogout}
              className='flex items-center gap-2 text-[15px] text-[#B42318] m-0 rounded-none p-4'
            >
              <Icon.logout />
              Log out
            </DropdownMenuItem>

            <DropdownMenuSeparator className='my-0' />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
