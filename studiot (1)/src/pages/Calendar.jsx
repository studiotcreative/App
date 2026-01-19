import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { format } from 'date-fns';
import { Plus, Filter, LayoutGrid } from 'lucide-react';
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

export default function Calendar() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => base44.entities.Workspace.list()
  });

  const { data: allAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.SocialAccount.list()
  });

  const { data: allPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list()
  });

  // Filter accounts based on role
  const accounts = useMemo(() => {
    if (isAdmin()) return allAccounts;
    return allAccounts.filter(acc => 
      acc.assigned_manager_email === user?.email || 
      acc.collaborator_emails?.includes(user?.email)
    );
  }, [allAccounts, isAdmin, user]);

  // Filter posts
  const posts = useMemo(() => {
    const accountIds = accounts.map(a => a.id);
    let filtered = allPosts.filter(p => accountIds.includes(p.social_account_id));
    
    if (selectedWorkspace !== 'all') {
      filtered = filtered.filter(p => p.workspace_id === selectedWorkspace);
    }
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(p => p.platform === selectedPlatform);
    }
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(p => p.social_account_id === selectedAccount);
    }
    
    return filtered;
  }, [allPosts, accounts, selectedWorkspace, selectedPlatform, selectedAccount]);

  // Filtered accounts for dropdown
  const filteredAccounts = useMemo(() => {
    let accs = accounts;
    if (selectedWorkspace !== 'all') {
      accs = accs.filter(a => a.workspace_id === selectedWorkspace);
    }
    if (selectedPlatform !== 'all') {
      accs = accs.filter(a => a.platform === selectedPlatform);
    }
    return accs;
  }, [accounts, selectedWorkspace, selectedPlatform]);

  const handleDateClick = (date) => {
    navigate(createPageUrl(`PostEditor?date=${format(date, 'yyyy-MM-dd')}`));
  };

  const handlePostClick = (post) => {
    navigate(createPageUrl(`PostEditor?id=${post.id}`));
  };

  const isLoading = loadingAccounts || loadingPosts;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Calendar</h1>
          <p className="text-slate-500 mt-1">
            {posts.length} posts scheduled
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate(createPageUrl('FeedPreview'))}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Feed Preview
          </Button>
          <Button 
            className="bg-slate-900 hover:bg-slate-800"
            onClick={() => navigate(createPageUrl('PostEditor'))}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {isAdmin() && (
          <Select value={selectedWorkspace} onValueChange={(v) => {
            setSelectedWorkspace(v);
            setSelectedAccount('all');
          }}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="All Workspaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workspaces</SelectItem>
              {workspaces.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
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
                @{a.handle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      ) : (
        <CalendarView
          posts={posts}
          accounts={accounts}
          onDateClick={handleDateClick}
          onPostClick={handlePostClick}
        />
      )}
    </div>
  );
}