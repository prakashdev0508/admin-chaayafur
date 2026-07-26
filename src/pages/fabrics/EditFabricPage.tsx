import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { FabricForm } from "@/components/fabrics/FabricForm";
import { queryKeys } from "@/lib/query-keys";
import { getFabric, updateFabric } from "@/services/fabrics.service";
import type { UpdateFabricPayload } from "@/types/fabric";

export function EditFabricPage() {
  const { id } = useParams<{ id: string }>();
  const fabricId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fabricQuery = useQuery({
    queryKey: queryKeys.fabrics.detail(fabricId),
    queryFn: () => getFabric(fabricId),
    enabled: Number.isFinite(fabricId) && fabricId > 0,
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateFabricPayload) =>
      updateFabric(fabricId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fabrics.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fabrics.detail(fabricId),
      });
      toast.success("Fabric updated");
      navigate("/fabrics");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update fabric",
      );
    },
  });

  if (fabricQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fabricQuery.isError || !fabricQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Edit fabric" />
        <p className="text-sm text-destructive">
          {fabricQuery.error instanceof Error
            ? fabricQuery.error.message
            : "Fabric not found"}
        </p>
        <Button
          variant="outline"
          render={<Link to="/fabrics">Back to fabrics</Link>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Edit ${fabricQuery.data.name}`}
        description="Update fabric catalog details."
        action={
          <Button
            variant="outline"
            render={
              <Link to="/fabrics">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            }
          />
        }
      />
      <FabricForm
        mode="edit"
        initial={fabricQuery.data}
        loading={mutation.isPending}
        onSubmit={(payload) => mutation.mutateAsync(payload)}
      />
    </div>
  );
}
