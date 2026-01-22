import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider"; // keep using the same import path

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Workspaces() {
  const { isLoadingAuth, user } = useAuth();

  const {
    data: workspaces = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspaces"],
    enabled: !isLoadingAuth && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoadingAuth) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-3" />
        <Skeleton className="h-24 w-full mb-3" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Workspaces</h1>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <Card className="p-4">
          <div className="text-sm text-red-600">
            Failed to load workspaces: {error?.message || "Unknown error"}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            If this returns an empty list but you expect rows, it’s almost always RLS or missing memberships.
          </div>
        </Card>
      ) : workspaces.length === 0 ? (
        <Card className="p-6">
          <div className="font-medium">No workspaces found.</div>
          <div className="text-sm text-muted-foreground mt-1">
            If you’re an admin and still see nothing, your RLS/policies are blocking select.
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {workspaces.map((w) => (
            <Link key={w.id} to={`/WorkspaceDetails?workspaceId=${w.id}`}>
              <Card className="p-4 hover:shadow-sm transition">
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {w.id}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
