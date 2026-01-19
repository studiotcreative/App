import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, GripVertical } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { toast } from "sonner";

export default function FeedPreviewGrid({ 
  posts, 
  accounts, 
  platform = 'instagram',
  isReadOnly = false 
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState(posts);

  React.useEffect(() => {
    setItems(posts);
  }, [posts]);

  const updateOrderMutation = useMutation({
    mutationFn: async (orderedPosts) => {
      const updates = orderedPosts.map((post, index) => 
        base44.entities.Post.update(post.id, { order_index: index })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Order updated');
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination || isReadOnly) return;

    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setItems(reordered);
    updateOrderMutation.mutate(reordered);
  };

  const getAccountById = (id) => accounts.find(a => a.id === id);

  // Instagram/Facebook - 3 column grid
  const isGridLayout = platform === 'instagram' || platform === 'facebook';

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <PlatformIcon platform={platform} size="lg" />
        </div>
        <p className="text-slate-500">No posts to preview</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="feed" direction={isGridLayout ? 'horizontal' : 'vertical'}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={
              isGridLayout
                ? 'grid grid-cols-3 gap-1 bg-white rounded-xl overflow-hidden border border-slate-200'
                : 'space-y-3'
            }
          >
            {items.map((post, index) => {
              const account = getAccountById(post.social_account_id);
              
              return (
                <Draggable
                  key={post.id}
                  draggableId={post.id}
                  index={index}
                  isDragDisabled={isReadOnly}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={
                        isGridLayout
                          ? `aspect-square relative group cursor-pointer ${
                              snapshot.isDragging ? 'ring-2 ring-violet-500 z-10' : ''
                            }`
                          : `flex gap-4 p-4 bg-white rounded-xl border border-slate-200 ${
                              snapshot.isDragging ? 'ring-2 ring-violet-500' : ''
                            }`
                      }
                      onClick={() => navigate(createPageUrl(isReadOnly ? `ClientPostView?id=${post.id}` : `PostEditor?id=${post.id}`))}
                    >
                      {isGridLayout ? (
                        <>
                          {/* Grid Item */}
                          <div className="w-full h-full bg-slate-100">
                            {post.asset_urls?.[0] ? (
                              post.asset_types?.[0] === 'video' ? (
                                <div className="relative w-full h-full">
                                  <video
                                    src={post.asset_urls[0]}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <Play className="w-5 h-5 text-white drop-shadow-lg" fill="white" />
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={post.asset_urls[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlatformIcon platform={post.platform} size="lg" />
                              </div>
                            )}
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
                            <StatusBadge status={post.status} size="sm" />
                            <p className="text-white text-xs text-center mt-2 line-clamp-3">
                              {post.caption || 'No caption'}
                            </p>
                            {!isReadOnly && (
                              <div
                                {...provided.dragHandleProps}
                                className="absolute top-2 left-2 p-1 bg-white/20 rounded"
                              >
                                <GripVertical className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Vertical List Item */}
                          {!isReadOnly && (
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center"
                            >
                              <GripVertical className="w-5 h-5 text-slate-400" />
                            </div>
                          )}

                          <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            {post.asset_urls?.[0] ? (
                              post.asset_types?.[0] === 'video' ? (
                                <div className="relative w-full h-full">
                                  <video
                                    src={post.asset_urls[0]}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Play className="w-6 h-6 text-white" fill="white" />
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={post.asset_urls[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlatformIcon platform={post.platform} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-700">
                                @{account?.handle}
                              </span>
                              <StatusBadge status={post.status} size="sm" />
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {post.caption || 'No caption'}
                            </p>
                            {post.scheduled_date && (
                              <p className="text-xs text-slate-400 mt-1">
                                {post.scheduled_date} {post.scheduled_time}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}