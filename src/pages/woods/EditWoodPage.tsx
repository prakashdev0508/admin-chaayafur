import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { WoodForm } from "@/components/woods/WoodForm";
import { queryKeys } from "@/lib/query-keys";
import { getWood, updateWood } from "@/services/woods.service";
import type { UpdateWoodPayload } from "@/types/wood";

export function EditWoodPage() {
  const { id } = useParams<{ id: string }>();
  const woodId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const woodQuery = useQuery({
    queryKey: queryKeys.woods.detail(woodId),
    queryFn: () => getWood(woodId),
    enabled: Number.isFinite(woodId) && woodId > 0,
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateWoodPayload) => updateWood(woodId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.woods.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.woods.detail(woodId),
      });
      toast.success("Wood updated");
      navigate("/woods");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update wood",
      );
    },
  });

  if (woodQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (woodQuery.isError || !woodQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Edit wood" />
        <p className="text-sm text-destructive">
          {woodQuery.error instanceof Error
            ? woodQuery.error.message
            : "Wood not found"}
        </p>
        <Button variant="outline" render={<Link to="/woods">Back to woods</Link>} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Edit ${woodQuery.data.name}`}
        description="Update wood catalog details."
        action={
          <Button
            variant="outline"
            render={
              <Link to="/woods">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            }
          />
        }
      />
      <WoodForm
        mode="edit"
        initial={woodQuery.data}
        loading={mutation.isPending}
        onSubmit={(payload) => mutation.mutateAsync(payload)}
      />
    </div>
  );
}
