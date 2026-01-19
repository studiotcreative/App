import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [workspaceMemberships, setWorkspaceMemberships] = useState([]);
  const [assignedAccounts, setAssignedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Determine user's app-wide role (admin = agency admin)
      const isAdmin = currentUser.role === 'admin';
      
      // Get workspace memberships
      const memberships = await base44.entities.WorkspaceMember.filter({
        user_email: currentUser.email
      });
      setWorkspaceMemberships(memberships);
      
      // Get assigned social accounts (for account managers)
      const accounts = await base44.entities.SocialAccount.filter({
        assigned_manager_email: currentUser.email
      });
      
      // Also get accounts where user is a collaborator
      const allAccounts = await base44.entities.SocialAccount.list();
      const collaboratorAccounts = allAccounts.filter(acc => 
        acc.collaborator_emails?.includes(currentUser.email)
      );
      
      const uniqueAccounts = [...accounts];
      collaboratorAccounts.forEach(acc => {
        if (!uniqueAccounts.find(a => a.id === acc.id)) {
          uniqueAccounts.push(acc);
        }
      });
      
      setAssignedAccounts(uniqueAccounts);
      
      // Determine effective role
      if (isAdmin) {
        setUserRole('admin');
      } else if (accounts.length > 0 || collaboratorAccounts.length > 0) {
        setUserRole('account_manager');
      } else if (memberships.some(m => m.role === 'client_approver')) {
        setUserRole('client_approver');
      } else if (memberships.some(m => m.role === 'client_viewer')) {
        setUserRole('client_viewer');
      } else {
        setUserRole('viewer');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => userRole === 'admin';
  const isAccountManager = () => userRole === 'account_manager' || userRole === 'admin';
  const isClient = () => userRole === 'client_viewer' || userRole === 'client_approver';
  const canApprove = () => userRole === 'client_approver' || userRole === 'admin';
  
  const getClientWorkspaceId = () => {
    if (isAdmin()) return null;
    const clientMembership = workspaceMemberships.find(m => 
      m.role === 'client_viewer' || m.role === 'client_approver'
    );
    return clientMembership?.workspace_id;
  };

  const hasAccessToWorkspace = (workspaceId) => {
    if (isAdmin()) return true;
    return workspaceMemberships.some(m => m.workspace_id === workspaceId);
  };

  const hasAccessToAccount = (accountId) => {
    if (isAdmin()) return true;
    if (isClient()) {
      // Clients can see all accounts in their workspace
      return true; // Access checked at workspace level
    }
    return assignedAccounts.some(a => a.id === accountId);
  };

  const value = {
    user,
    userRole,
    workspaceMemberships,
    assignedAccounts,
    loading,
    isAdmin,
    isAccountManager,
    isClient,
    canApprove,
    getClientWorkspaceId,
    hasAccessToWorkspace,
    hasAccessToAccount,
    refresh: loadUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}