// src/components/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/api/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (ignore) return
      setUser(user ?? null)

      if (!user) {
        setProfile(null)
        setMemberships([])
        setLoading(false)
        return
      }

      // profile (global role)
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .single()

      if (ignore) return
      setProfile(prof ?? null)

      // memberships (workspace roles)
      const { data: mem } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)

      if (ignore) return
      setMemberships(mem ?? [])
      setLoading(false)
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(() => load())

    return () => {
      ignore = true
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  const userRole = useMemo(() => {
    if (profile?.role === 'admin') return 'admin'
    // “account_manager” if they are an account manager in any workspace
    if (memberships.some(m => m.role === 'account_manager')) return 'account_manager'
    if (memberships.some(m => m.role === 'client_approver')) return 'client_approver'
    if (memberships.some(m => m.role === 'client_viewer')) return 'client_viewer'
    return 'viewer'
  }, [profile, memberships])

  const isAdmin = () => userRole === 'admin'
  const isAccountManager = () => userRole === 'account_manager' || userRole === 'admin'
  const isClient = () => userRole === 'client_viewer' || userRole === 'client_approver'
  const canApprove = () => userRole === 'client_approver' || userRole === 'admin'

  const value = {
    user,
    profile,
    memberships,
    userRole,
    loading,
    isAdmin,
    isAccountManager,
    isClient,
    canApprove,
    refresh: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user ?? null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
