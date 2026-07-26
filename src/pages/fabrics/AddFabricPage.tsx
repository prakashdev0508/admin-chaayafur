import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { FabricForm } from "@/components/fabrics/FabricForm";
import { queryKeys } from "@/lib/query-keys";
import { createFabric } from "@/services/fabrics.service";
import type { CreateFabricPayload } from "@/types/fabric";

export function AddFabricPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateFabricPayload) => createFabric(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fabrics.all });
      toast.success("Fabric created");
      navigate("/fabrics");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create fabric",
      );
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="New fabric"
        description="Add a fabric option to the global catalog."
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
        mode="create"
        loading={mutation.isPending}
        onSubmit={(payload) =>
          mutation.mutateAsync(payload as CreateFabricPayload)
        }
      />
    </div>
  );
}
