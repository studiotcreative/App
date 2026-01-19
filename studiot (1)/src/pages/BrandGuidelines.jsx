import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BrandGuidelinesForm from '@/components/brand/BrandGuidelinesForm';
import { Book, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function BrandGuidelines() {
  const { user, isAdmin, workspaceMemberships } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const workspaceId = urlParams.get('workspace');

  const { data: workspace, isLoading: loadingWorkspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const workspaces = await base44.entities.Workspace.list();
      return workspaces.find(w => w.id === workspaceId);
    },
    enabled: !!workspaceId
  });

  const { data: guidelines, isLoading: loadingGuidelines } = useQuery({
    queryKey: ['brandGuidelines', workspaceId],
    queryFn: async () => {
      const all = await base44.entities.BrandGuidelines.filter({ workspace_id: workspaceId });
      return all[0] || null;
    },
    enabled: !!workspaceId
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, workspace_id: workspaceId };
      if (guidelines?.id) {
        return base44.entities.BrandGuidelines.update(guidelines.id, payload);
      } else {
        return base44.entities.BrandGuidelines.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandGuidelines', workspaceId] });
      toast.success('Brand guidelines saved successfully');
    }
  });

  if (!workspaceId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No workspace selected</p>
          <Button onClick={() => navigate(createPageUrl('Workspaces'))} className="mt-4">
            Go to Workspaces
          </Button>
        </div>
      </div>
    );
  }

  if (loadingWorkspace || loadingGuidelines) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl(`WorkspaceDetails?id=${workspaceId}`))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspace
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Brand Guidelines</h1>
              <p className="text-gray-600">{workspace?.name}</p>
            </div>
          </div>
        </div>

        <BrandGuidelinesForm
          guidelines={guidelines}
          onSave={(data) => saveMutation.mutate(data)}
          loading={saveMutation.isPending}
        />
      </div>
    </div>
  );
}