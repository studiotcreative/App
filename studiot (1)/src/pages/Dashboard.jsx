import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  format,
  isToday,
  isTomorrow,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Calendar, Plus, ArrowRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import PlatformIcon from "@/components/ui/PlatformIcon";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const { data: workspaces = [], isLoading: loadingWorkspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      // RLS should already restrict to accounts in workspaces the user can access.
      const { data, error } = await supabase
        .from("social_accounts")
        .select("id, workspace_id, platform, handle, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      // If you want newest first, order by scheduled_date desc then created_at desc
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("scheduled_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Filter posts by selected workspace/platform.
  // RLS already ensures only allowed rows are returned.
  const posts = useMemo(() => {
    let filtered = allPosts;

    if (selectedWorkspace !== "all") {
      filtered = filtered.filter((p) => p.workspace_id === selectedWorkspace);
    }
    if (selectedPlatform !== "all") {
      filtered = filtered.filter((p) => p.platform === selectedPlatform);
    }

    // Optional: only keep posts tied to accounts we can see (safety for UI joins)
    const accountIds = new Set(accounts.map((a) => a.id));
    filtered = filtered.filter((p) => !p.social_account_id || accountIds.has(p.social_account_id));

    return filtered;
  }, [allPosts, accounts, selectedWorkspace, selectedPlatform]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    return {
      total: posts.length,
      draft: posts.filter((p) => p.status === "draft").length,
      awaitingApproval: posts.filter((p) => p.status === "sent_to_client").length,
      approved: posts.filter((p) => p.status === "approved" || p.status === "ready_to_post").length,
      thisWeek: posts.filter((p) => {
        if (!p.scheduled_date) return false;
        const d = parseISO(p.scheduled_date);
        return d >= weekStart && d <= weekEnd;
      }).length,
    };
  }, [posts]);

  const upcomingPosts = useMemo(() => {
    const now = new Date();
    return posts
      .filter(
        (p) =>
          p.scheduled_date &&
          parseISO(p.scheduled_date) >= now &&
          p.status !== "posted"
      )
      .sort((a, b) => parseISO(a.scheduled_date) - parseISO(b.scheduled_date))
      .slice(0, 8);
  }, [posts]);

  const needsAttention = useMemo(() => {
    return posts
      .filter((p) => p.status === "sent_to_client" || p.status === "internal_review")
      .slice(0, 5);
  }, [posts]);

  const getAccountById = (id) => accounts.find((a) => a.id === id);
  const getWorkspaceById = (id) => workspaces.find((w) => w.id === id);

  const formatScheduledDate = (dateStr) => {
    if (!dateStr) return "Unscheduled";
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const isLoading = loadingWorkspaces || loadingAccounts || loadingPosts;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {user?.full_name?.split(" ")[0] || "there"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin?.() && (
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
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

          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
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

          <Link to={createPageUrl("PostEditor")}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">This Week</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.thisWeek}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Drafts</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.draft}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Awaiting Approval</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-amber-600 mt-1">{stats.awaitingApproval}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Ready to Post</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Posts */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Upcoming Posts</CardTitle>
              <Link to={createPageUrl("Calendar")}>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                  View Calendar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : upcomingPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No upcoming posts scheduled</p>
                  <Link to={createPageUrl("PostEditor")}>
                    <Button variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingPosts.map((post) => {
                    const account = getAccountById(post.social_account_id);
                    const workspace = getWorkspaceById(post.workspace_id);

                    return (
                      <Link
                        key={post.id}
                        to={createPageUrl(`PostEditor?id=${post.id}`)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                      >
                        <div className="w-14 h-14 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
                          {post.asset_urls?.[0] ? (
                            <img
                              src={post.asset_urls[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PlatformIcon platform={post.platform} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <PlatformIcon platform={post.platform} size="sm" />
                            <span className="text-sm font-medium text-slate-900">
                              @{account?.handle || "Unknown"}
                            </span>
                            {isAdmin?.() && workspace && (
                              <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-200/60 rounded-full">
                                {workspace.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 truncate">
                            {post.caption || "No caption yet"}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            {formatScheduledDate(post.scheduled_date)}
                            {post.scheduled_time && (
                              <span className="text-slate-400 ml-1">{post.scheduled_time}</span>
                            )}
                          </span>
                          <StatusBadge status={post.status} size="sm" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Needs Attention + Accounts */}
        <div>
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : needsAttention.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {needsAttention.map((post) => {
                    const account = getAccountById(post.social_account_id);
                    return (
                      <Link
                        key={post.id}
                        to={createPageUrl(`PostEditor?id=${post.id}`)}
                        className="block p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <PlatformIcon platform={post.platform} size="sm" />
                          <span className="text-sm font-medium text-slate-700 truncate">
                            @{account?.handle || "Unknown"}
                          </span>
                        </div>
                        <StatusBadge status={post.status} size="sm" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/60 mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Your Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No accounts assigned</p>
              ) : (
                <div className="space-y-2">
                  {accounts.slice(0, 6).map((account) => {
                    const accountPosts = posts.filter((p) => p.social_account_id === account.id);
                    const pendingCount = accountPosts.filter(
                      (p) => p.status !== "posted" && p.status !== "draft"
                    ).length;

                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={account.platform} showBg size="sm" />
                          <span className="text-sm font-medium text-slate-700">@{account.handle}</span>
                        </div>
                        <span className="text-sm text-slate-500">{pendingCount} pending</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
