import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { format, parseISO } from 'date-fns';
import { 
  Upload, 
  X, 
  Copy, 
  Download, 
  Check,
  Image,
  Video,
  Calendar,
  Clock,
  Hash,
  MessageSquare,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import PlatformIcon from '@/components/ui/PlatformIcon';
import StatusBadge, { statusConfig } from '@/components/ui/StatusBadge';

export default function PostForm({ 
  post, 
  onSave, 
  onDelete,
  initialDate,
  isLoading 
}) {
  const { user, isAdmin, isClient } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    social_account_id: '',
    workspace_id: '',
    platform: '',
    scheduled_date: initialDate || '',
    scheduled_time: '',
    status: 'draft',
    caption: '',
    hashtags: '',
    first_comment: '',
    internal_notes: '',
    client_notes: '',
    asset_urls: [],
    asset_types: [],
    order_index: 0
  });
  
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.SocialAccount.list()
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => base44.entities.Workspace.list()
  });

  // Filter accounts based on role
  const accounts = React.useMemo(() => {
    if (isAdmin()) return allAccounts;
    return allAccounts.filter(acc => 
      acc.assigned_manager_email === user?.email || 
      acc.collaborator_emails?.includes(user?.email)
    );
  }, [allAccounts, isAdmin, user]);

  // Initialize form with post data
  useEffect(() => {
    if (post) {
      setFormData({
        social_account_id: post.social_account_id || '',
        workspace_id: post.workspace_id || '',
        platform: post.platform || '',
        scheduled_date: post.scheduled_date || '',
        scheduled_time: post.scheduled_time || '',
        status: post.status || 'draft',
        caption: post.caption || '',
        hashtags: post.hashtags || '',
        first_comment: post.first_comment || '',
        internal_notes: post.internal_notes || '',
        client_notes: post.client_notes || '',
        asset_urls: post.asset_urls || [],
        asset_types: post.asset_types || [],
        order_index: post.order_index || 0
      });
    }
  }, [post]);

  // Update workspace and platform when account changes
  const handleAccountChange = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setFormData(prev => ({
        ...prev,
        social_account_id: accountId,
        workspace_id: account.workspace_id,
        platform: account.platform
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      
      const newUrls = results.map(r => r.file_url);
      const newTypes = files.map(f => f.type.startsWith('video') ? 'video' : 'image');
      
      setFormData(prev => ({
        ...prev,
        asset_urls: [...prev.asset_urls, ...newUrls],
        asset_types: [...prev.asset_types, ...newTypes]
      }));
      
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeAsset = (index) => {
    setFormData(prev => ({
      ...prev,
      asset_urls: prev.asset_urls.filter((_, i) => i !== index),
      asset_types: prev.asset_types.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = async (text, type) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadAsset = (url, index) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-${index + 1}`;
    link.click();
  };

  const downloadAllAssets = () => {
    formData.asset_urls.forEach((url, i) => {
      setTimeout(() => downloadAsset(url, i), i * 500);
    });
    toast.success('Downloading all assets...');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.social_account_id) {
      toast.error('Please select an account');
      return;
    }
    onSave(formData);
  };

  const selectedAccount = accounts.find(a => a.id === formData.social_account_id);
  const selectedWorkspace = workspaces.find(w => w.id === formData.workspace_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Selection */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Account & Schedule</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Social Account</Label>
            <Select 
              value={formData.social_account_id} 
              onValueChange={handleAccountChange}
              disabled={isClient()}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={account.platform} size="sm" />
                      <span>@{account.handle}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
              disabled={isClient()}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Scheduled Date</Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                className="pl-10"
                disabled={isClient()}
              />
            </div>
          </div>

          <div>
            <Label>Scheduled Time</Label>
            <div className="relative mt-1.5">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                className="pl-10"
                disabled={isClient()}
              />
            </div>
          </div>
        </div>

        {selectedWorkspace && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <span className="px-2 py-1 bg-slate-100 rounded-md font-medium">
              {selectedWorkspace.name}
            </span>
            {selectedAccount && (
              <span className="flex items-center gap-1">
                <PlatformIcon platform={selectedAccount.platform} size="sm" />
                @{selectedAccount.handle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Content</h3>
        
        <Tabs defaultValue="caption" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="caption">Caption</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
            <TabsTrigger value="comment">First Comment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="caption">
            <div className="relative">
              <Textarea
                value={formData.caption}
                onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Write your caption..."
                className="min-h-[200px] resize-none"
                disabled={isClient()}
              />
              {formData.caption && !isClient() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(formData.caption, 'Caption')}
                >
                  {copied === 'Caption' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {formData.caption.length} characters
            </p>
          </TabsContent>
          
          <TabsContent value="hashtags">
            <div className="relative">
              <div className="absolute left-3 top-3 w-4 h-4 text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <Textarea
                value={formData.hashtags}
                onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                placeholder="#hashtag1 #hashtag2 #hashtag3"
                className="min-h-[150px] pl-10 resize-none"
                disabled={isClient()}
              />
              {formData.hashtags && !isClient() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(formData.hashtags, 'Hashtags')}
                >
                  {copied === 'Hashtags' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="comment">
            <div className="relative">
              <Textarea
                value={formData.first_comment}
                onChange={(e) => setFormData(prev => ({ ...prev, first_comment: e.target.value }))}
                placeholder="First comment to post after publishing..."
                className="min-h-[150px] resize-none"
                disabled={isClient()}
              />
              {formData.first_comment && !isClient() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(formData.first_comment, 'First Comment')}
                >
                  {copied === 'First Comment' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Media Assets */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-700">Media Assets</h3>
          {formData.asset_urls.length > 0 && !isClient() && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadAllAssets}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          )}
        </div>

        {/* Upload Zone */}
        {!isClient() && (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer mb-4">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-500">
                  Click to upload images or videos
                </span>
              </>
            )}
          </label>
        )}

        {/* Asset Grid */}
        {formData.asset_urls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.asset_urls.map((url, index) => (
              <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                {formData.asset_types[index] === 'video' ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => downloadAsset(url, index)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {!isClient() && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeAsset(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  {formData.asset_types[index] === 'video' ? (
                    <Video className="w-5 h-5 text-white drop-shadow-lg" />
                  ) : (
                    <Image className="w-5 h-5 text-white drop-shadow-lg" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Notes</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isClient() && (
            <div>
              <Label className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-slate-400" />
                Internal Notes
              </Label>
              <Textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                placeholder="Notes visible only to the team..."
                className="mt-1.5 min-h-[100px] resize-none"
              />
            </div>
          )}

          <div className={isClient() ? 'md:col-span-2' : ''}>
            <Label className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              Client-Facing Notes
            </Label>
            <Textarea
              value={formData.client_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, client_notes: e.target.value }))}
              placeholder="Notes visible to the client..."
              className="mt-1.5 min-h-[100px] resize-none"
              disabled={isClient()}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isClient() && (
        <div className="flex items-center justify-between">
          <div>
            {post && onDelete && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(post.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {post ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}