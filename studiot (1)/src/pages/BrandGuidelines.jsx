import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BrandGuidelinesForm from "@/components/brand/BrandGuidelinesForm";
import { Book, ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function BrandGuidelines() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const workspaceId = urlParams.get("workspace");

  const { data: workspace, isLoading: loadingWorkspace } = useQuery({
    queryKey: ["workspace", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("id", workspaceId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: guidelines, isLoading: loadingGuidelines } = useQuery({
    queryKey: ["brandGuidelines", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_guidelines")
        .select("id, workspace_id, data")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) throw error;

      // Map DB shape -> form shape (form expects the actual fields)
      return data ? { id: data.id, ...data.data } : null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (!workspaceId) throw new Error("Missing workspaceId");
      if (!user?.id) throw new Error("Not authenticated");

      const payload = {
        workspace_id: workspaceId,
        data: formData, // store entire form as jsonb
        updated_by: user.id,
      };

      if (guidelines?.id) {
        const { error } = await supabase
          .from("brand_guidelines")
          .update(payload)
          .eq("id", guidelines.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("brand_guidelines").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandGuidelines", workspaceId] });
      toast.success("Brand guidelines saved successfully");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to save brand guidelines");
    },
  });

  if (!workspaceId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No workspace selected</p>
          <Button onClick={() => navigate(createPageUrl("Workspaces"))} className="mt-4">
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
