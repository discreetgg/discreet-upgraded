'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useAllUsers } from '@/hooks/queries/use-all-users';
import { useAllPosts } from '@/hooks/queries/use-all-posts';
import { ComponentLoader } from '@/components/ui/component-loader';

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export default function AdminDashboard() {
  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const { data: posts = [], isLoading: postsLoading } = useAllPosts();

  const totalUsers = users.length;
  const activeBans = users.filter((u) => u.isBanned).length;
  const newUsersToday = users.filter((u) => isToday(u.createdAt)).length;
  const totalPosts = posts.length;

  return (
    <div className="py-6 px-2">
      <main className="relative md:pt-[88px] space-y-6">
        {/* Header */}
        <div className="max-w-[1200px] w-full space-y-1">
          <div className="flex items-center justify-between gap-3 md:mb-0 mb-2">
            <Image
              src="/logo.png"
              height={41}
              width={41}
              alt="logo"
              className="md:hidden"
            />
            <h1 className="md:text-[32px] text-[15px] font-semibold text-[#F8F8F8]">
              Admin Dashboard
            </h1>
            <div className="md:hidden" />
          </div>

          <p className="text-[#8A8C95] font-light text-[15px] md:block hidden">
            Manage your platform, monitor activity, and moderate content
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1200px]">
          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#8A8C95] text-xs font-medium">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <ComponentLoader className="h-8 w-8" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Icon.profile className="w-5 h-5 text-[#FF007F]" />
                    <span className="text-[#F8F8F8] text-2xl font-bold">
                      {totalUsers.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#8A8C95] text-xs mt-1">
                    +{newUsersToday} today
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#8A8C95] text-xs font-medium">
                Total Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <ComponentLoader className="h-8 w-8" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Icon.image className="w-5 h-5 text-[#FF007F]" />
                    <span className="text-[#F8F8F8] text-2xl font-bold">
                      {totalPosts.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#8A8C95] text-xs mt-1">
                    All posts
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#8A8C95] text-xs font-medium">
                Active Bans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <ComponentLoader className="h-8 w-8" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Icon.ban className="w-5 h-5 text-[#FF007F]" />
                    <span className="text-[#F8F8F8] text-2xl font-bold">
                      {activeBans}
                    </span>
                  </div>
                  <p className="text-[#8A8C95] text-xs mt-1">
                    Banned accounts
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#8A8C95] text-xs font-medium">
                Pending Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon.flag className="w-5 h-5 text-[#FF007F]" />
                <span className="text-[#F8F8F8] text-2xl font-bold">
                  —
                </span>
              </div>
              <p className="text-[#8A8C95] text-xs mt-1">
                Coming soon
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="max-w-[1200px]">
          <h2 className="text-[#F8F8F8] text-xl font-semibold mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/admin/accounts"
              className="bg-[#0F1114] border border-[#1E1E21] rounded-xl p-4 hover:border-[#FF007F] transition-all duration-300 hover:shadow-[2px_2px_0_0_#FF007F]"
            >
              <Icon.profile className="w-6 h-6 text-[#FF007F] mb-2" />
              <p className="text-[#F8F8F8] text-sm font-medium">
                Manage Accounts
              </p>
            </Link>

            <Link
              href="/admin/posts"
              className="bg-[#0F1114] border border-[#1E1E21] rounded-xl p-4 hover:border-[#FF007F] transition-all duration-300 hover:shadow-[2px_2px_0_0_#FF007F]"
            >
              <Icon.image className="w-6 h-6 text-[#FF007F] mb-2" />
              <p className="text-[#F8F8F8] text-sm font-medium">
                Manage Posts
              </p>
            </Link>

            <Link
              href="/admin/chats"
              className="bg-[#0F1114] border border-[#1E1E21] rounded-xl p-4 hover:border-[#FF007F] transition-all duration-300 hover:shadow-[2px_2px_0_0_#FF007F]"
            >
              <Icon.messages className="w-6 h-6 text-[#FF007F] mb-2" />
              <p className="text-[#F8F8F8] text-sm font-medium">
                Monitor Chats
              </p>
            </Link>

            <Link
              href="/admin/bans"
              className="bg-[#0F1114] border border-[#1E1E21] rounded-xl p-4 hover:border-[#FF007F] transition-all duration-300 hover:shadow-[2px_2px_0_0_#FF007F]"
            >
              <Icon.ban className="w-6 h-6 text-[#FF007F] mb-2" />
              <p className="text-[#F8F8F8] text-sm font-medium">
                Ban Management
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="max-w-[1200px]">
          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardHeader>
              <CardTitle className="text-[#F8F8F8] text-lg">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#15171B] border border-[#1E1E21] flex items-center justify-center mb-4">
                  <Icon.flag className="w-6 h-6 text-[#8A8C95]" />
                </div>
                <p className="text-[#F8F8F8] text-sm font-medium">
                  No recent activity
                </p>
                <p className="text-[#8A8C95] text-xs mt-1 max-w-[280px]">
                  Bans, reports, and other moderation events will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
