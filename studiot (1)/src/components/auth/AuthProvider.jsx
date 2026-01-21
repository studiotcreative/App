// /src/components/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // supabase auth user
  const [profile, setProfile] = useState(null); // public.profiles row
  const [memberships, setMemberships] = useState([]); // public.workspace_members rows
  const [loading, setLoading] = useState(true);

  // boot + listen
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
        setMemberships([]);
        setLoading(false);
        return;
      }

      // load profile
      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .eq("id", session.user.id)
        .single();

      if (pErr) {
        // common when profile trigger not installed yet
        console.error("profiles load error:", pErr);
        setProfile(null);
      } else {
        setProfile(p);
      }

      // load memberships (RLS will filter properly)
      const { data: m, error: mErr } = await supabase
        .from("workspace_members")
        .select("workspace_id, user_id, role, created_at")
        .eq("user_id", session.user.id);

      if (mErr) {
        console.error("memberships load error:", mErr);
        setMemberships([]);
      } else {
        setMemberships(m ?? []);
      }

      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      // reload everything after auth changes
      load();
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // helpers derived from DB roles (frontend isn’t enforcing, only reflecting)
  const globalRole = profile?.role ?? "user";
  const isAdmin = () => globalRole === "admin";

  const isClient = () =>
    memberships.some((m) => m.role === "client_viewer" || m.role === "client_approver");

  const canApprove = () =>
    isAdmin() || memberships.some((m) => m.role === "client_approver");

  const hasAccessToWorkspace = (workspaceId) =>
    isAdmin() || memberships.some((m) => m.workspace_id === workspaceId);

  // if client, usually one workspace (your UI assumes that pattern)
  const getClientWorkspaceId = () => {
    if (isAdmin()) return null;
    const cm = memberships.find((m) => m.role === "client_viewer" || m.role === "client_approver");
    return cm?.workspace_id ?? null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(() => ({
    session,
    user,
    profile,
    memberships,
    loading,
    globalRole,
    isAdmin,
    isClient,
    canApprove,
    hasAccessToWorkspace,
    getClientWorkspaceId,
    signOut,
    refresh: async () => {
      // lightweight refresh: re-fetch profile/memberships
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session ?? null);
      setUser(session?.user ?? null);
    }
  }), [session, user, profile, memberships, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
