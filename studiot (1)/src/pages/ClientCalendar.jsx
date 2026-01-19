import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { LayoutGrid, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import CalendarView from '@/components/calendar/CalendarView';
import PlatformIcon from '@/components/ui/PlatformIcon';

export default function ClientCalendar() {
  const navigate = useNavigate();
  const { user, workspaceMemberships, loading } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');

  // Get client's workspace ID
  const clientWorkspaceId = useMemo(() => {
    const membership = workspaceMemberships.find(m => 
      m.role === 'client_viewer' || m.role === 'client_approver'
    );
    return membership?.workspace_id;
  }, [workspaceMemberships]);

  const { data: workspace, isLoading: loadingWorkspace } = useQuery({
    queryKey: ['client-workspace', clientWorkspaceId],
    queryFn: () => base44.entities.Workspace.filter({ id: clientWorkspaceId }).then(r => r[0]),
    enabled: !!clientWorkspaceId
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['client-accounts', clientWorkspaceId],
    queryFn: () => base44.entities.SocialAccount.filter({ workspace_id: clientWorkspaceId }),
    enabled: !!clientWorkspaceId
  });

  const { data: allPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['client-posts', clientWorkspaceId],
    queryFn: () => base44.entities.Post.filter({ workspace_id: clientWorkspaceId }),
    enabled: !!clientWorkspaceId
  });

  // Filter posts
  const posts = useMemo(() => {
    let filtered = allPosts.filter(p => p.status !== 'draft'); // Hide drafts from clients
    
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(p => p.platform === selectedPlatform);
    }
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(p => p.social_account_id === selectedAccount);
    }
    
    return filtered;
  }, [allPosts, selectedPlatform, selectedAccount]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    if (selectedPlatform === 'all') return accounts;
    return accounts.filter(a => a.platform === selectedPlatform);
  }, [accounts, selectedPlatform]);

  const handlePostClick = (post) => {
    navigate(createPageUrl(`ClientPostView?id=${post.id}`));
  };

  const isLoading = loading || loadingWorkspace || loadingAccounts || loadingPosts;

  if (!clientWorkspaceId && !loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No Workspace Found</h2>
        <p className="text-slate-500">
          You don't have access to any workspace. Please contact your account manager.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          {workspace ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900">{workspace.name}</h1>
              <p className="text-slate-500 mt-1">Content Calendar</p>
            </>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate(createPageUrl('ClientFeed'))}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Feed Preview
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={selectedPlatform} onValueChange={(v) => {
          setSelectedPlatform(v);
          setSelectedAccount('all');
        }}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {filteredAccounts.map(a => (
              <SelectItem key={a.id} value={a.id}>
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={a.platform} size="sm" />
                  @{a.handle}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200/60 p-4">
          <p className="text-sm text-slate-500">Awaiting Your Approval</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {posts.filter(p => p.status === 'sent_to_client').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {posts.filter(p => p.status === 'approved' || p.status === 'ready_to_post').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4">
          <p className="text-sm text-slate-500">In Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {posts.filter(p => p.status === 'internal_review').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4">
          <p className="text-sm text-slate-500">Posted</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {posts.filter(p => p.status === 'posted').length}
          </p>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      ) : (
        <CalendarView
          posts={posts}
          accounts={accounts}
          isReadOnly={true}
          onPostClick={handlePostClick}
        />
      )}
    </div>
  );
}