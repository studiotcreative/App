import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { ArrowLeft, Copy, Download, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PostForm from '@/components/posts/PostForm';
import PostComments from '@/components/posts/PostComments';
import PostApproval from '@/components/posts/PostApproval';
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformIcon from '@/components/ui/PlatformIcon';

export default function PostEditor() {
  const navigate = useNavigate();
  const { user, isClient, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  const initialDate = urlParams.get('date');

  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => base44.entities.Post.filter({ id: postId }).then(r => r[0]),
    enabled: !!postId
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.SocialAccount.list()
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => base44.entities.Workspace.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.create(data),
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created');
      navigate(createPageUrl(`PostEditor?id=${newPost.id}`));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.update(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast.success('Post updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
      navigate(createPageUrl('Calendar'));
    }
  });

  const handleSave = (formData) => {
    if (postId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate({
        ...formData,
        created_by: user.email
      });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(postId);
    }
  };

  const handleMarkPosted = async () => {
    await updateMutation.mutateAsync({
      status: 'posted',
      posted_at: new Date().toISOString(),
      posted_by: user.email
    });
    
    await base44.entities.AuditLog.create({
      workspace_id: post.workspace_id,
      entity_type: 'post',
      entity_id: postId,
      action: 'posted',
      actor_email: user.email,
      actor_name: user.full_name,
      details: JSON.stringify({ action: 'Marked as posted' })
    });
    
    toast.success('Post marked as posted!');
  };

  const copyAll = async () => {
    const text = [
      post.caption,
      '',
      post.hashtags,
      '',
      post.first_comment ? `First Comment: ${post.first_comment}` : ''
    ].filter(Boolean).join('\n');
    
    await navigator.clipboard.writeText(text);
    toast.success('All content copied!');
  };

  const downloadAllAssets = () => {
    post.asset_urls?.forEach((url, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `asset-${i + 1}`;
        link.click();
      }, i * 500);
    });
    toast.success('Downloading assets...');
  };

  const account = accounts.find(a => a.id === post?.social_account_id);
  const workspace = workspaces.find(w => w.id === post?.workspace_id);

  if (loadingPost && postId) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {postId ? 'Edit Post' : 'New Post'}
            </h1>
            {post && account && (
              <div className="flex items-center gap-2 mt-1">
                <PlatformIcon platform={post.platform} size="sm" />
                <span className="text-slate-500">@{account.handle}</span>
                {workspace && (
                  <span className="text-slate-400">• {workspace.name}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {post && (
          <div className="flex items-center gap-3">
            <StatusBadge status={post.status} />
            
            {/* Posting Mode Actions */}
            {!isClient() && (post.status === 'approved' || post.status === 'ready_to_post') && (
              <>
                <Button variant="outline" onClick={copyAll}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
                {post.asset_urls?.length > 0 && (
                  <Button variant="outline" onClick={downloadAllAssets}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Assets
                  </Button>
                )}
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleMarkPosted}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4 mr-2" />
                  )}
                  Mark as Posted
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Approval Section */}
          {post && <PostApproval post={post} />}
          
          <PostForm
            post={post}
            onSave={handleSave}
            onDelete={handleDelete}
            initialDate={initialDate}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          {post?.asset_urls?.[0] && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-6">
              <h3 className="text-sm font-medium text-slate-700 mb-4">Preview</h3>
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                {post.asset_types?.[0] === 'video' ? (
                  <video 
                    src={post.asset_urls[0]} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={post.asset_urls[0]} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {postId && (
            <PostComments postId={postId} workspaceId={post?.workspace_id} />
          )}
        </div>
      </div>
    </div>
  );
}