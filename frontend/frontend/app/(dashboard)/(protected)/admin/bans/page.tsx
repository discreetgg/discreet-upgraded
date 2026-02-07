'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { toast } from 'sonner';
import { useBannedUsers } from '@/hooks/queries/use-banned-users';
import { unbanUserByDiscordIdService } from '@/lib/services';
import type { UserType } from '@/types/global';
import { ComponentLoader } from '@/components/ui/component-loader';
import { useQueryClient } from '@tanstack/react-query';

function getDiscordAvatarUrl(discordId: string, discordAvatar: string | undefined) {
  if (discordAvatar?.trim()) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`;
  }
  return `https://cdn.discordapp.com/embed/avatars/0.png`;
}

export default function BanManagementPage() {
  const queryClient = useQueryClient();
  const { data: bannedUsersFromApi = [], isLoading } = useBannedUsers();
  const [bannedUsers, setBannedUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [unbanningDiscordId, setUnbanningDiscordId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'lifted' | 'appeals'>(
    'all'
  );

  useEffect(() => {
    setBannedUsers(bannedUsersFromApi);
  }, [bannedUsersFromApi]);

  const filteredBans = bannedUsers.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.banReason ?? '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || filterStatus === 'active';
    return matchesSearch && matchesFilter;
  });

  const handleUnbanUser = async (user: UserType) => {
    try {
      setUnbanningDiscordId(user.discordId);
      await unbanUserByDiscordIdService(user.discordId);
      setBannedUsers(bannedUsers.filter((u) => u.discordId !== user.discordId));
      await queryClient.invalidateQueries({ queryKey: ['banned-users'] });
      await queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(`User @${user.username} has been unbanned`);
      setViewDialogOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to unban user';
      toast.error(message);
    } finally {
      setUnbanningDiscordId(null);
    }
  };

  const handleApproveAppeal = () => {
    if (!selectedUser) return;
    toast.success(`Appeal approved for @${selectedUser.username}`);
    setAppealDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRejectAppeal = () => {
    if (!selectedUser) return;
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;
    toast.success(`Appeal rejected for @${selectedUser.username}`);
    setAppealDialogOpen(false);
    setSelectedUser(null);
  };

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
              Ban Management
            </h1>
            <div className="md:hidden" />
          </div>

          <p className="text-[#8A8C95] font-light text-[15px] md:block hidden">
            View ban history, manage appeals, and track moderation actions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1200px]">
          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Total Bans</p>
                {isLoading ? (
                  <ComponentLoader className="h-8 w-8 mx-auto" />
                ) : (
                  <p className="text-[#F8F8F8] text-2xl font-bold">
                    {bannedUsers.length}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Active Bans</p>
                {isLoading ? (
                  <ComponentLoader className="h-8 w-8 mx-auto" />
                ) : (
                  <p className="text-[#FF007F] text-2xl font-bold">
                    {bannedUsers.length}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Pending Appeals</p>
                <p className="text-yellow-500 text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Lifted Bans</p>
                <p className="text-green-500 text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-[#0F1114] border-[#1E1E21] max-w-[1200px]">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by username or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#15171B] border-[#1E1E21] text-[#F8F8F8] placeholder:text-[#8A8C95]"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  className={
                    filterStatus === 'all'
                      ? 'bg-[#FF007F] text-[#0F1114]'
                      : 'bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]'
                  }
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('active')}
                  className={
                    filterStatus === 'active'
                      ? 'bg-[#FF007F] text-[#0F1114]'
                      : 'bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]'
                  }
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === 'appeals' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('appeals')}
                  className={
                    filterStatus === 'appeals'
                      ? 'bg-[#FF007F] text-[#0F1114]'
                      : 'bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]'
                  }
                >
                  Appeals
                </Button>
                <Button
                  variant={filterStatus === 'lifted' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('lifted')}
                  className={
                    filterStatus === 'lifted'
                      ? 'bg-[#FF007F] text-[#0F1114]'
                      : 'bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]'
                  }
                >
                  Lifted
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ban History Table */}
        <Card className="bg-[#0F1114] border-[#1E1E21] max-w-[1200px]">
          <CardHeader>
            <CardTitle className="text-[#F8F8F8]">
              Ban History ({filteredBans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1E1E21] hover:bg-[#15171B]">
                    <TableHead className="text-[#8A8C95]">User</TableHead>
                    <TableHead className="text-[#8A8C95]">Reason</TableHead>
                    <TableHead className="text-[#8A8C95]">Status</TableHead>
                    <TableHead className="text-[#8A8C95]">Banned Date</TableHead>
                    <TableHead className="text-[#8A8C95] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <ComponentLoader className="mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredBans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-[#8A8C95]">
                        No banned users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBans.map((user) => {
                      const avatarUrl =
                        user.profileImage?.url ??
                        getDiscordAvatarUrl(user.discordId, user.discordAvatar);
                      return (
                        <TableRow
                          key={user.discordId}
                          className="border-[#1E1E21] hover:bg-[#15171B]"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Image
                                src={avatarUrl}
                                alt={user.username}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              <div>
                                <p className="text-[#F8F8F8] font-medium">
                                  {user.displayName}
                                </p>
                                <p className="text-[#8A8C95] text-xs">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-[#F8F8F8] text-sm line-clamp-2 max-w-[300px]">
                              {user.banReason ?? '—'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="destructive"
                              className="bg-red-500/10 text-red-500 border-red-500"
                            >
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[#8A8C95] text-xs">
                            {user.bannedAt
                              ? new Date(user.bannedAt).toLocaleDateString()
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setViewDialogOpen(true);
                                }}
                                className="bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]"
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUnbanUser(user)}
                                disabled={unbanningDiscordId === user.discordId}
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                {unbanningDiscordId === user.discordId
                                  ? 'Unbanning…'
                                  : 'Unban'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Ban Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="bg-[#0F1114] border border-[#1E1E21] rounded-[14.6px] shadow-[4px_4px_0_0_#1F2227] max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-[#F8F8F8]">Ban Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
                {/* User Info */}
                <div className="flex items-center gap-3 p-4 bg-[#15171B] rounded-lg border border-[#1E1E21]">
                  <Image
                    src={
                      selectedUser.profileImage?.url ??
                      getDiscordAvatarUrl(selectedUser.discordId, selectedUser.discordAvatar)
                    }
                    alt={selectedUser.username}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-[#F8F8F8] font-medium">
                      {selectedUser.displayName}
                    </p>
                    <p className="text-[#8A8C95] text-sm">
                      @{selectedUser.username}
                    </p>
                    <p className="text-[#8A8C95] text-xs">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {/* Ban Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-[#8A8C95] text-xs mb-1">Ban Reason:</p>
                    <p className="text-[#F8F8F8] text-sm bg-[#15171B] p-3 rounded-lg border border-[#1E1E21]">
                      {selectedUser.banReason ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8A8C95] text-xs mb-1">Banned Date:</p>
                    <p className="text-[#F8F8F8] text-sm">
                      {selectedUser.bannedAt
                        ? new Date(selectedUser.bannedAt).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
                className="bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]"
              >
                Close
              </Button>
              {selectedUser && (
                <Button
                  onClick={() => handleUnbanUser(selectedUser)}
                  disabled={!!unbanningDiscordId}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {unbanningDiscordId ? 'Unbanning…' : 'Unban'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Appeal Dialog */}
        <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
          <DialogContent className="bg-[#0F1114] border border-[#1E1E21] rounded-[14.6px] shadow-[4px_4px_0_0_#1F2227] max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-[#F8F8F8]">Review Appeal</DialogTitle>
              <DialogDescription className="text-[#8A8C95]">
                Review the ban appeal from @{selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
                {/* Original Ban Reason */}
                <div>
                  <p className="text-[#8A8C95] text-xs mb-1">Original Ban Reason:</p>
                  <p className="text-[#F8F8F8] text-sm bg-[#15171B] p-3 rounded-lg border border-[#1E1E21]">
                    {selectedUser.banReason ?? '—'}
                  </p>
                </div>

                {/* Appeal Message */}
                <div>
                  <p className="text-[#8A8C95] text-xs mb-1">Appeal Message:</p>
                  <p className="text-[#F8F8F8] text-sm bg-[#15171B] p-3 rounded-lg border border-[#1E1E21]">
                    {(selectedUser as UserType & { appealMessage?: string }).appealMessage ?? '—'}
                  </p>
                </div>

                {/* Appeal Date */}
                <p className="text-[#8A8C95] text-xs">
                  Appealed on: {(selectedUser as UserType & { appealedAt?: string }).appealedAt ?? '—'}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAppealDialogOpen(false)}
                className="bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectAppeal}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Reject Appeal
              </Button>
              <Button
                onClick={handleApproveAppeal}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                Approve Appeal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
