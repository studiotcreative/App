import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { format, parseISO } from 'date-fns';
import { Send, MessageSquare, Check, EyeOff, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function PostComments({ postId, workspaceId }) {
  const { user, isClient } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => base44.entities.Comment.filter({ post_id: postId })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setNewComment('');
      toast.success('Comment added');
    }
  });

  const toggleResolved = useMutation({
    mutationFn: ({ id, resolved }) => 
      base44.entities.Comment.update(id, { is_resolved: resolved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    createMutation.mutate({
      post_id: postId,
      workspace_id: workspaceId,
      author_email: user.email,
      author_name: user.full_name,
      content: newComment,
      is_internal: isClient() ? false : isInternal
    });
  };

  // Filter comments based on role
  const visibleComments = comments.filter(c => {
    if (isClient()) return !c.is_internal;
    return true;
  });

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Comments ({visibleComments.length})
      </h3>

      {/* Comment List */}
      <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : visibleComments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No comments yet
          </p>
        ) : (
          visibleComments.map(comment => (
            <div 
              key={comment.id} 
              className={`flex gap-3 p-3 rounded-lg ${
                comment.is_resolved 
                  ? 'bg-slate-50 opacity-60' 
                  : comment.is_internal 
                    ? 'bg-amber-50 border border-amber-200' 
                    : 'bg-slate-50'
              }`}
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-slate-200">
                  {getInitials(comment.author_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {comment.author_name}
                    </span>
                    {comment.is_internal && (
                      <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" />
                        Internal
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {format(parseISO(comment.created_date), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className={`text-sm ${comment.is_resolved ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                  {comment.content}
                </p>
                {!isClient() && !comment.is_resolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs text-slate-500"
                    onClick={() => toggleResolved.mutate({ id: comment.id, resolved: true })}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[80px] resize-none"
        />
        <div className="flex items-center justify-between">
          {!isClient() && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Checkbox
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              Internal only (hidden from client)
            </label>
          )}
          {isClient() && <div />}
          <Button 
            type="submit" 
            disabled={!newComment.trim() || createMutation.isPending}
            size="sm"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}