import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  ArrowLeft, 
  Plus, 
  UserPlus,
  Users,
  Trash2,
  Pencil,
  MoreVertical,
  Loader2,
  Building2,
  Book
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import PlatformIcon, { platformConfig } from '@/components/ui/PlatformIcon';

export default function WorkspaceDetails() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const workspaceId = urlParams.get('id');

  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    platform: 'instagram',
    handle: '',
    display_name: '',
    assigned_manager_email: ''
  });
  const [memberForm, setMemberForm] = useState({
    user_email: '',
    role: 'client_viewer'
  });

  const { data: workspace, isLoading: loadingWorkspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => base44.entities.Workspace.filter({ id: workspaceId }).then(r => r[0]),
    enabled: !!workspaceId
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['workspace-accounts', workspaceId],
    queryFn: () => base44.entities.SocialAccount.filter({ workspace_id: workspaceId }),
    enabled: !!workspaceId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => base44.entities.WorkspaceMember.filter({ workspace_id: workspaceId }),
    enabled: !!workspaceId
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Account mutations
  const createAccountMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialAccount.create({
      ...data,
      workspace_id: workspaceId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-accounts', workspaceId] });
      setShowAccountDialog(false);
      resetAccountForm();
      toast.success('Account added');
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SocialAccount.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-accounts', workspaceId] });
      setShowAccountDialog(false);
      resetAccountForm();
      toast.success('Account updated');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-accounts', workspaceId] });
      toast.success('Account removed');
    }
  });

  // Member mutations
  const createMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkspaceMember.create({
      ...data,
      workspace_id: workspaceId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      setShowMemberDialog(false);
      setMemberForm({ user_email: '', role: 'client_viewer' });
      toast.success('Member added');
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('Member removed');
    }
  });

  const resetAccountForm = () => {
    setEditingAccount(null);
    setAccountForm({
      platform: 'instagram',
      handle: '',
      display_name: '',
      assigned_manager_email: ''
    });
  };

  const openEditAccountDialog = (account) => {
    setEditingAccount(account);
    setAccountForm({
      platform: account.platform,
      handle: account.handle,
      display_name: account.display_name || '',
      assigned_manager_email: account.assigned_manager_email
    });
    setShowAccountDialog(true);
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (!accountForm.handle || !accountForm.assigned_manager_email) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, data: accountForm });
    } else {
      createAccountMutation.mutate(accountForm);
    }
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    if (!memberForm.user_email) {
      toast.error('Please enter an email');
      return;
    }

    // Check if user exists in the app
    const userExists = allUsers.some(u => u.email === memberForm.user_email);
    
    if (!userExists) {
      try {
        // Invite user to the app first
        const appRole = memberForm.role === 'account_manager' ? 'admin' : 'user';
        await base44.users.inviteUser(memberForm.user_email, appRole);
        toast.success(`Invitation sent to ${memberForm.user_email}`);
      } catch (error) {
        toast.error('Failed to send invitation');
        return;
      }
    }
    
    // Add user to workspace
    createMemberMutation.mutate(memberForm);
  };

  const getInitials = (email) => {
    const user = allUsers.find(u => u.email === email);
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const getUserName = (email) => {
    const user = allUsers.find(u => u.email === email);
    return user?.full_name || email;
  };

  if (!isAdmin()) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-slate-500">You don't have access to this page.</p>
      </div>
    );
  }

  if (loadingWorkspace) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
            {workspace.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{workspace.name}</h1>
            <p className="text-slate-500">/{workspace.slug}</p>
          </div>
        </div>
        <Button
          onClick={() => navigate(createPageUrl(`BrandGuidelines?workspace=${workspaceId}`))}
          variant="outline"
          className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
        >
          <Book className="w-4 h-4 mr-2 text-purple-600" />
          <span className="text-purple-700 font-medium">Brand Guidelines</span>
        </Button>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="accounts">Social Accounts</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Social Accounts Tab */}
        <TabsContent value="accounts">
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Social Accounts</CardTitle>
              <Button onClick={() => {
                resetAccountForm();
                setShowAccountDialog(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No social accounts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map(account => (
                    <div 
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={account.platform} showBg />
                        <div>
                          <p className="font-medium text-slate-900">@{account.handle}</p>
                          <p className="text-sm text-slate-500">
                            {platformConfig[account.platform]?.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Assigned to</p>
                          <p className="text-sm font-medium text-slate-700">
                            {getUserName(account.assigned_manager_email)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditAccountDialog(account)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Delete this account?')) {
                                  deleteAccountMutation.mutate(account.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="members">
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Button onClick={() => setShowMemberDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map(member => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-slate-200">
                            {getInitials(member.user_email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">
                            {getUserName(member.user_email)}
                          </p>
                          <p className="text-sm text-slate-500">{member.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.role === 'client_approver' 
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {member.role.replace('_', ' ')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Remove this member?')) {
                              deleteMemberMutation.mutate(member.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200/60">
              <CardHeader>
                <CardTitle className="text-base">Workspace Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="font-medium">{workspace.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Slug</p>
                  <p className="font-medium">/{workspace.slug}</p>
                </div>
                {workspace.notes && (
                  <div>
                    <p className="text-sm text-slate-500">Notes</p>
                    <p className="text-sm">{workspace.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200/60">
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">Social Accounts</p>
                  <p className="font-semibold text-xl">{accounts.length}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">Team Members</p>
                  <p className="font-semibold text-xl">{members.length}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workspace.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {workspace.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Account' : 'Add Social Account'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update account details' : 'Add a new social account to this workspace'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <Label>Platform</Label>
              <Select 
                value={accountForm.platform} 
                onValueChange={(v) => setAccountForm(prev => ({ ...prev, platform: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(platformConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={key} size="sm" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Handle / Username *</Label>
              <Input
                value={accountForm.handle}
                onChange={(e) => setAccountForm(prev => ({ ...prev, handle: e.target.value }))}
                placeholder="@username"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={accountForm.display_name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Account display name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Assigned Account Manager *</Label>
              <Select 
                value={accountForm.assigned_manager_email} 
                onValueChange={(v) => setAccountForm(prev => ({ ...prev, assigned_manager_email: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.filter(u => u.role === 'admin' || u.role === 'user').map(user => (
                    <SelectItem key={user.email} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAccountDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
              >
                {(createAccountMutation.isPending || updateAccountMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingAccount ? 'Update' : 'Add Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a client or team member to this workspace. New users will receive an invitation email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMemberSubmit} className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={memberForm.user_email}
                onChange={(e) => setMemberForm(prev => ({ ...prev, user_email: e.target.value }))}
                placeholder="email@example.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select 
                value={memberForm.role} 
                onValueChange={(v) => setMemberForm(prev => ({ ...prev, role: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_viewer">Client Viewer (view only)</SelectItem>
                  <SelectItem value="client_approver">Client Approver (can approve posts)</SelectItem>
                  <SelectItem value="account_manager">Account Manager (internal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMemberDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMemberMutation.isPending}>
                {createMemberMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}