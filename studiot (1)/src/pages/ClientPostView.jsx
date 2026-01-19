import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { format, parseISO } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Hash,
  MessageSquare,
  Image,
  Video,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformIcon from '@/components/ui/PlatformIcon';
import PostComments from '@/components/posts/PostComments';
import PostApproval from '@/components/posts/PostApproval';

export default function ClientPostView() {
  const navigate = useNavigate();
  const { canApprove } = useAuth();
  const [currentAsset, setCurrentAsset] = React.useState(0);
  
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  const { data: post, isLoading: loadingPost, refetch } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => base44.entities.Post.filter({ id: postId }).then(r => r[0]),
    enabled: !!postId
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.SocialAccount.list()
  });

  const account = accounts.find(a => a.id === post?.social_account_id);

  if (loadingPost) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-slate-500">Post not found</p>
      </div>
    );
  }

  const nextAsset = () => {
    if (post.asset_urls && currentAsset < post.asset_urls.length - 1) {
      setCurrentAsset(prev => prev + 1);
    }
  };

  const prevAsset = () => {
    if (currentAsset > 0) {
      setCurrentAsset(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex items-center gap-2">
              <PlatformIcon platform={post.platform} size="sm" />
              <span className="text-lg font-semibold text-slate-900">
                @{account?.handle || 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-slate-500">Post Details</p>
          </div>
        </div>
        <StatusBadge status={post.status} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Media Section */}
        <div className="space-y-4">
          {/* Main Asset */}
          <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden">
            {post.asset_urls?.length > 0 ? (
              <>
                {post.asset_types?.[currentAsset] === 'video' ? (
                  <video 
                    src={post.asset_urls[currentAsset]} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={post.asset_urls[currentAsset]} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Navigation arrows */}
                {post.asset_urls.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-lg"
                      onClick={prevAsset}
                      disabled={currentAsset === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-lg"
                      onClick={nextAsset}
                      disabled={currentAsset === post.asset_urls.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Dots indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {post.asset_urls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentAsset(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentAsset ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PlatformIcon platform={post.platform} size="lg" />
              </div>
            )}
          </div>

          {/* Asset thumbnails */}
          {post.asset_urls?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {post.asset_urls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentAsset(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentAsset 
                      ? 'border-violet-500 ring-2 ring-violet-200' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {post.asset_types?.[idx] === 'video' ? (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <Video className="w-4 h-4 text-slate-500" />
                    </div>
                  ) : (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          {/* Approval Section */}
          <PostApproval post={post} onUpdate={refetch} />

          {/* Schedule */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-5">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Schedule</h3>
            <div className="flex items-center gap-4">
              {post.scheduled_date ? (
                <>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(parseISO(post.scheduled_date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  {post.scheduled_time && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {post.scheduled_time}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-slate-500">Not scheduled yet</span>
              )}
            </div>
          </div>

          {/* Caption */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-5">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Caption</h3>
            <p className="text-slate-700 whitespace-pre-wrap">
              {post.caption || 'No caption'}
            </p>
          </div>

          {/* Hashtags */}
          {post.hashtags && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Hashtags
              </h3>
              <p className="text-blue-600">
                {post.hashtags}
              </p>
            </div>
          )}

          {/* First Comment */}
          {post.first_comment && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                First Comment
              </h3>
              <p className="text-slate-700">
                {post.first_comment}
              </p>
            </div>
          )}

          {/* Client Notes */}
          {post.client_notes && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="text-sm font-medium text-blue-700 mb-3">Notes from the team</h3>
              <p className="text-blue-800">
                {post.client_notes}
              </p>
            </div>
          )}

          {/* Comments */}
          <PostComments postId={postId} workspaceId={post.workspace_id} />
        </div>
      </div>
    </div>
  );
}