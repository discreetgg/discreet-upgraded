'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import type { UserType } from '@/types/global';
import { ComponentLoader } from '@/components/ui/component-loader';
import { useAllUsers } from '@/hooks/queries/use-all-users';
import {
  banUserByDiscordIdService,
  unbanUserByDiscordIdService,
  deleteUserByDiscordIdService,
} from '@/lib/services';
import { useQueryClient } from '@tanstack/react-query';

export default function ManageAccountsPage() {
  const queryClient = useQueryClient();
  const { data: usersFromApi = [], isLoading: loading } = useAllUsers();
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDiscordId, setDeletingDiscordId] = useState<string | null>(null);
  const [banningDiscordId, setBanningDiscordId] = useState<string | null>(null);
  const [unbanningDiscordId, setUnbanningDiscordId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');

  useEffect(() => {
    setUsers(usersFromApi);
  }, [usersFromApi]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && !user.isBanned) ||
      (filterStatus === 'banned' && user.isBanned);

    return matchesSearch && matchesFilter;
  });

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('Please provide a ban reason');
      return;
    }
    try {
      setBanningDiscordId(selectedUser.discordId);
      await banUserByDiscordIdService(selectedUser.discordId, {
        reason: banReason.trim(),
      });
      setUsers(
        users.map((user) =>
          user.discordId === selectedUser.discordId
            ? {
                ...user,
                isBanned: true,
                banReason,
                bannedAt: new Date().toISOString(),
              }
            : user
        )
      );
      await queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(`User @${selectedUser.username} has been banned`);
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason('');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to ban user';
      toast.error(message);
    } finally {
      setBanningDiscordId(null);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;
    try {
      setUnbanningDiscordId(selectedUser.discordId);
      await unbanUserByDiscordIdService(selectedUser.discordId);
      setUsers(
        users.map((user) =>
          user.discordId === selectedUser.discordId
            ? {
                ...user,
                isBanned: false,
                banReason: undefined,
                bannedAt: undefined,
              }
            : user
        )
      );
      await queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(`User @${selectedUser.username} has been unbanned`);
      setUnbanDialogOpen(false);
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

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setDeletingDiscordId(selectedUser.discordId);
      await deleteUserByDiscordIdService(selectedUser.discordId);
      setUsers(users.filter((u) => u.discordId !== selectedUser.discordId));
      await queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(`User @${selectedUser.username} has been deleted`);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeletingDiscordId(null);
    }
  };

  const getDiscordAvatarUrl = (discordId: string, discordAvatar: string | undefined) => {
    if (discordAvatar?.trim()) {
      return `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/0.png`;
  };

  return (
    <div className="py-6 px-2">
      <main className="relative md:pt-[88px] space-y-6">
        {/* Header */}
        <div className="max-w-[1200px] w-full space-y-1">
          <div className="flex items-center object-cover rounded-full justify-between gap-3 md:mb-0 mb-2">
           
            <h1 className="md:text-[32px] text-[15px] font-semibold text-[#F8F8F8]">
              Manage Accounts
            </h1>
            <div className="md:hidden" />
          </div>

          <p className="text-[#8A8C95] font-light text-[15px] md:block hidden">
            View, ban, and manage user accounts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-[1200px]">
          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Total Users</p>
                <p className="text-[#F8F8F8] text-2xl font-bold">{users.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Active Users</p>
                <p className="text-[#F8F8F8] text-2xl font-bold">
                  {users.filter((u) => !u.isBanned).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Banned Users</p>
                <p className="text-[#FF007F] text-2xl font-bold">
                  {users.filter((u) => u.isBanned).length}
                </p>
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
                  placeholder="Search by username, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#15171B] border-[#1E1E21] text-[#F8F8F8] placeholder:text-[#8A8C95]"
                />
              </div>
              <div className="flex gap-2">
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
                  variant={filterStatus === 'banned' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('banned')}
                  className={
                    filterStatus === 'banned'
                      ? 'bg-[#FF007F] text-[#0F1114]'
                      : 'bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]'
                  }
                >
                  Banned
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-[#0F1114] border-[#1E1E21] max-w-[1200px]">
          <CardHeader>
            <CardTitle className="text-[#F8F8F8]">
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <ComponentLoader />
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1E1E21] hover:bg-[#15171B] bg-[#0F1114] sticky top-0 z-10">
                      <TableHead className="text-[#8A8C95]">User</TableHead>
                      <TableHead className="text-[#8A8C95]">Role</TableHead>
                      <TableHead className="text-[#8A8C95]">Status</TableHead>
                      <TableHead className="text-[#8A8C95]">Stats</TableHead>
                      <TableHead className="text-[#8A8C95]">Joined</TableHead>
                      <TableHead className="text-[#8A8C95] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-[#8A8C95]">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow
                          key={user.discordId}
                          className="border-[#1E1E21] hover:bg-[#15171B]"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Image
                                src={
                                  user.profileImage?.url ||
                                  getDiscordAvatarUrl(user.discordId, user.discordAvatar)
                                }
                                alt={user.username}
                                width={40}
                                height={40}
                                className="rounded-full object-cover w-[40px] h-[40px]"
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
                            <Badge
                              variant="outline"
                              className={
                                user.role === 'seller'
                                  ? 'border-[#FF007F] text-[#FF007F]'
                                  : user.role === 'admin'
                                  ? 'border-blue-500 text-blue-500'
                                  : 'border-[#8A8C95] text-[#8A8C95]'
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isBanned ? (
                              <Badge
                                variant="destructive"
                                className="bg-red-500/10 text-red-500 border-red-500"
                              >
                                Banned
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-green-500 text-green-500"
                              >
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-[#8A8C95]">
                              <p>{user.followerCount || 0} followers</p>
                              <p>{user.followingCount || 0} following</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-[#8A8C95] text-xs">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {user.isBanned ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUnbanDialogOpen(true);
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  Unban
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setBanDialogOpen(true);
                                  }}
                                >
                                  Ban
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteDialogOpen(true);
                                }}
                                className="border-red-500 text-red-500 hover:bg-red-500/10"
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ban User Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent className="bg-[#0F1114] border border-[#1E1E21] rounded-[14.6px] shadow-[4px_4px_0_0_#1F2227] max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[#F8F8F8]">Ban User</DialogTitle>
              <DialogDescription className="text-[#8A8C95]">
                Ban @{selectedUser?.username}? They will no longer be able to access
                the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-[#F8F8F8] text-sm mb-2 block">
                  Ban Reason *
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for ban..."
                  className="w-full h-24 bg-[#15171B] border border-[#1E1E21] rounded-lg p-3 text-[#F8F8F8] placeholder:text-[#8A8C95] resize-none focus:outline-none focus:border-[#FF007F]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBanDialogOpen(false);
                  setBanReason('');
                }}
                disabled={!!banningDiscordId}
                className="bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBanUser}
                disabled={!!banningDiscordId}
                className="bg-[#FF007F] text-[#0F1114] hover:bg-[#FF007F]/90"
              >
                {banningDiscordId ? 'Banning…' : 'Ban User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unban User Dialog */}
        <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
          <DialogContent className="bg-[#0F1114] border border-[#1E1E21] rounded-[14.6px] shadow-[4px_4px_0_0_#1F2227] max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[#F8F8F8]">Unban User</DialogTitle>
              <DialogDescription className="text-[#8A8C95]">
                Unban @{selectedUser?.username}? They will regain access to the
                platform.
              </DialogDescription>
            </DialogHeader>
            {selectedUser?.banReason && (
              <div className="py-4">
                <p className="text-[#8A8C95] text-sm mb-2">Original ban reason:</p>
                <p className="text-[#F8F8F8] text-sm bg-[#15171B] p-3 rounded-lg border border-[#1E1E21]">
                  {selectedUser.banReason}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUnbanDialogOpen(false)}
                disabled={!!unbanningDiscordId}
                className="bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnbanUser}
                disabled={!!unbanningDiscordId}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {unbanningDiscordId ? 'Unbanning…' : 'Unban User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-[#0F1114] border border-red-500/30 rounded-[14.6px] shadow-[4px_4px_0_0_rgba(239,68,68,0.2)] max-w-[420px] p-6 gap-6">
            <DialogHeader className="space-y-4 text-center sm:text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <Icon.deleteContent className="h-6 w-6 text-red-500" />
              </div>
              <DialogTitle className="text-[#F8F8F8] text-lg font-semibold">
                Delete user?
              </DialogTitle>
              <DialogDescription asChild>
                <p className="text-[#8A8C95] text-sm leading-relaxed">
                  @{selectedUser?.username} will be permanently removed. This cannot be undone.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={!!deletingDiscordId}
                className="order-2 bg-[#15171B] border-[#1E1E21] text-[#F8F8F8] hover:bg-[#1E1E21]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={!!deletingDiscordId}
                className="order-1 bg-red-500 text-white hover:bg-red-600"
              >
                {deletingDiscordId ? 'Deleting…' : 'Delete user'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
