import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import FeedPreviewGrid from "@/components/feed/FeedPreviewGrid";
import PlatformIcon, { platformConfig } from "@/components/ui/PlatformIcon";

export default function FeedPreview() {
  const navigate = useNavigate();
  const { loading, isAdmin, isClient } = useAuth();

  const [selectedWorkspace, setSelectedWorkspace] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");

  // Admin-only workspace dropdown
  const { data: workspaces = [] } = useQuery({
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

  // Accessible accounts (RLS filters by membership)
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

  // Accessible posts (RLS filters by membership)
  const { data: allPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["posts"],
    enabled: !loading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, workspace_id, social_account_id, platform, status, approval_status, asset_urls, asset_types, order_index"
        )
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Filter accounts by workspace + platform
  const filteredAccounts = useMemo(() => {
    let accs = allAccounts;

    if (selectedWorkspace !== "all") {
      accs = accs.filter((a) => a.workspace_id === selectedWorkspace);
    }

    accs = accs.filter((a) => a.platform === selectedPlatform);

    return accs;
  }, [allAccounts, selectedWorkspace, selectedPlatform]);

  // Filter posts (same behavior)
  const posts = useMemo(() => {
    let filtered = allPosts.filter((p) => p.status !== "posted");

    if (selectedWorkspace !== "all") {
      filtered = filtered.filter((p) => p.workspace_id === selectedWorkspace);
    }

    if (selectedAccount !== "all") {
      filtered = filtered.filter((p) => p.social_account_id === selectedAccount);
    } else {
      const accountIds = new Set(filteredAccounts.map((a) => a.id));
      filtered = filtered.filter((p) =>
        p.social_account_id ? accountIds.has(p.social_account_id) : false
      );
    }

    return filtered.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }, [allPosts, selectedWorkspace, selectedAccount, filteredAccounts]);

  const isLoadingAny = loading || loadingAccounts || loadingPosts;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Feed Preview</h1>
            <p className="text-slate-500 mt-1">
              Preview how posts will appear on each platform
            </p>
          </div>
        </div>
        {!isClient() && (
          <Button
            className="bg-slate-900 hover:bg-slate-800"
            onClick={() => navigate(createPageUrl("PostEditor"))}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {/* Platform Tabs */}
      <Tabs
        value={selectedPlatform}
        onValueChange={(v) => {
          setSelectedPlatform(v);
          setSelectedAccount("all");
        }}
        className="mb-6"
      >
        <TabsList className="bg-white border border-slate-200">
          {Object.entries(platformConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <PlatformIcon platform={key} size="sm" />
              <span className="hidden sm:inline">{config.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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

        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts ({filteredAccounts.length})</SelectItem>
            {filteredAccounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                @{a.handle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feed Preview */}
      {isLoadingAny ? (
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-6">
          {/* Account Header */}
          {selectedAccount !== "all" && (
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <PlatformIcon platform={selectedPlatform} size="lg" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">
                  @{filteredAccounts.find((a) => a.id === selectedAccount)?.handle}
                </h3>
                <p className="text-sm text-slate-500">{posts.length} scheduled posts</p>
              </div>
            </div>
          )}

          <FeedPreviewGrid
            posts={posts}
            accounts={allAccounts}
            platform={selectedPlatform}
            isReadOnly={isClient()}
          />
        </div>
      )}
    </div>
  );
}
