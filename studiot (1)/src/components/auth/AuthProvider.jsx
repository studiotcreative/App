// /src/components/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadForSession = async (sess) => {
    setSession(sess ?? null);
    setUser(sess?.user ?? null);

    if (!sess?.user) {
      setProfile(null);
      setMemberships([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // profile
    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("id", sess.user.id)
      .maybeSingle();

    if (pErr) {
      console.error("profiles load error:", pErr);
      setProfile(null);
    } else {
      setProfile(p ?? null);
    }

    // memberships
    const { data: m, error: mErr } = await supabase
      .from("workspace_members")
      .select("workspace_id, user_id, role, created_at")
      .eq("user_id", sess.user.id);

    if (mErr) {
      console.error("memberships load error:", mErr);
      setMemberships([]);
    } else {
      setMemberships(m ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) console.error("getSession error:", error);
      await loadForSession(data?.session ?? null);
    };

    boot();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        await loadForSession(newSession ?? null);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Derived helpers
  const globalRole = profile?.role ?? "user";
  const isAdmin = () => globalRole === "admin";

  const isClient = () =>
    memberships.some((m) => m.role === "client_viewer" || m.role === "client_approver");

  const canApprove = () => isAdmin() || memberships.some((m) => m.role === "client_approver");

  const hasAccessToWorkspace = (workspaceId) =>
    isAdmin() || memberships.some((m) => m.workspace_id === workspaceId);

  const getClientWorkspaceId = () => {
    if (isAdmin()) return null;
    const cm = memberships.find(
      (m) => m.role === "client_viewer" || m.role === "client_approver"
    );
    return cm?.workspace_id ?? null;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("signOut error:", error);
  };

  const value = useMemo(
    () => ({
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
        const { data } = await supabase.auth.getSession();
        await loadForSession(data?.session ?? null);
      },
    }),
    [session, user, profile, memberships, loading]
  );

  // Debug (optional)
  console.log("AUTH USER", user);
  console.log("PROFILE ROLE", profile?.role);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

