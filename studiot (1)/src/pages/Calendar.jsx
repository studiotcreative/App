import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { Plus, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import CalendarView from "@/components/calendar/CalendarView";

export default function Calendar() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();

  const [selectedWorkspace, setSelectedWorkspace] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");

  // Admin dropdown only (RLS will still restrict for non-admin)
  const { data: workspaces = [], isLoading: loadingWorkspaces } = useQuery({
    queryKey: ["workspaces"],
    enabled: !loading && isAdmin(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Accounts accessible to user (RLS limits by workspace membership)
  const { data: allAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["accounts"],
    enabled: !loading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("id, workspace_id, platform, handle, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Posts accessible to user (RLS limits by workspace membership)
  const { data: allPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["posts"],
    enabled: !loading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, workspace_id, social_account_id, platform, scheduled_date, scheduled_time, status, approval_status, caption, hashtags, first_comment, client_notes, asset_urls, asset_types, order_index"
        )
        .order("scheduled_date", { ascending: true })
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Filter accounts for dropdowns
  const filteredAccounts = useMemo(() => {
    let accs = allAccounts;

    if (selectedWorkspace !== "all") {
      accs = accs.filter((a) => a.workspace_id === selectedWorkspace);
    }
    if (selectedPlatform !== "all") {
      accs = accs.filter((a) => a.platform === selectedPlatform);
    }
    return accs;
  }, [allAccounts, selectedWorkspace, selectedPlatform]);

  // Filter posts based on selected filters + available accounts
  const posts = useMemo(() => {
    const accountIds = new Set(filteredAccounts.map((a) => a.id));

    let filtered = allPosts.filter((p) =>
      p.social_account_id ? accountIds.has(p.social_account_id) : true
    );

    if (selectedWorkspace !== "all") {
      filtered = filtered.filter((p) => p.workspace_id === selectedWorkspace);
    }
    if (selectedPlatform !== "all") {
      filtered = filtered.filter((p) => p.platform === selectedPlatform);
    }
    if (selectedAccount !== "all") {
      filtered = filtered.filter((p) => p.social_account_id === selectedAccount);
    }

    return filtered;
  }, [allPosts, filteredAccounts, selectedWorkspace, selectedPlatform, selectedAccount]);

  const handleDateClick = (date) => {
    navigate(createPageUrl(`PostEditor?date=${format(date, "yyyy-MM-dd")}`));
  };

  const handlePostClick = (post) => {
    navigate(createPageUrl(`PostEditor?id=${post.id}`));
  };

  const isLoadingAny = loading || loadingAccounts || loadingPosts || (isAdmin() && loadingWorkspaces);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Calendar</h1>
          <p className="text-slate-500 mt-1">{posts.length} posts scheduled</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(createPageUrl("FeedPreview"))}>
            <LayoutGrid className="w-4 h-4 mr-2" />
            Feed Preview
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => navigate(createPageUrl("PostEditor"))}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {isAdmin() && (
          <Select
            value={selectedWorkspace}
            onValueChange={(v) => {
              setSelectedWorkspace(v);
              setSelectedAccount("all");
            }}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="All Workspaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workspaces</SelectItem>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={selectedPlatform}
          onValueChange={(v) => {
            setSelectedPlatform(v);
            setSelectedAccount("all");
          }}
        >
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
            {filteredAccounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                @{a.handle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar */}
      {isLoadingAny ? (
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      ) : (
        <CalendarView
          posts={posts}
          accounts={allAccounts}
          onDateClick={handleDateClick}
          onPostClick={handlePostClick}
        />
      )}
    </div>
  );
}
