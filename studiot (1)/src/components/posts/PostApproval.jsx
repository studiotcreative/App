import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { format, parseISO } from 'date-fns';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PostApproval({ post, onUpdate }) {
  const { user, canApprove, isClient } = useAuth();
  const queryClient = useQueryClient();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const updateMutation = useMutation({
  mutationFn: async ({ status, reason }) => {
    const { error } = await supabase.rpc('approve_post', {
      p_post_id: post.id,
      p_status: status,     // "approved" | "changes_requested"
      p_reason: reason ?? null
    });
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
    toast.success('Post updated');
    onUpdate?.();
  }
});

  const createComment = useMutation({
  mutationFn: async (data) => {
    const { error } = await supabase.from('comments').insert([data]);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
  }
});

  const createAuditLog = async (action, details) => {
  const { error } = await supabase.from('audit_logs').insert([{
    workspace_id: post.workspace_id,
    entity_type: 'post',
    entity_id: post.id,
    action,
    details
  }]);
  if (error) throw error;
};

  const handleApprove = async () => {
  await updateMutation.mutateAsync({ status: 'approved', reason: null });

  await createAuditLog('approved', {
    action: 'Post approved',
    approved_by: user?.email
  });

  toast.success('Post approved!');
};

  const handleRequestChanges = async () => {
  await updateMutation.mutateAsync({ status: 'changes_requested', reason: rejectReason || null });

  if (rejectReason) {
    await createComment.mutateAsync({
      post_id: post.id,
      workspace_id: post.workspace_id,
      content: `Changes requested: ${rejectReason}`,
      is_internal: false
    });
  }

  await createAuditLog('changes_requested', {
    action: 'Changes requested',
    reason: rejectReason || null,
    requested_by: user?.email
  });

  setShowRejectDialog(false);
  setRejectReason('');
  toast.info('Changes requested');
};

  // Only show for client facing statuses
  if (post.status !== 'sent_to_client' && !isClient()) {
    return null;
  }

  // Already approved/rejected
  if (post.approval_status === 'approved') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-800">Approved</p>
            <p className="text-sm text-emerald-600">
              by {post.approved_by} on {format(parseISO(post.approved_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (post.approval_status === 'changes_requested') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Changes Requested</p>
            <p className="text-sm text-amber-600">
              Please review the comments and update the post
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show approval buttons for clients
  if (!canApprove() || post.status !== 'sent_to_client') {
    return null;
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Awaiting Your Approval</p>
              <p className="text-sm text-blue-600">
                Review this post and approve or request changes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Request Changes
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </div>
        </div>
      </div>

      {/* Request Changes Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Let the team know what changes you'd like to see
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Describe the changes needed..."
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestChanges}
              disabled={updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
