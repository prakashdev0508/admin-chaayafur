import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { WoodForm } from "@/components/woods/WoodForm";
import { queryKeys } from "@/lib/query-keys";
import { createWood } from "@/services/woods.service";
import type { CreateWoodPayload } from "@/types/wood";

export function AddWoodPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateWoodPayload) => createWood(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.woods.all });
      toast.success("Wood created");
      navigate("/woods");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create wood",
      );
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="New wood"
        description="Add a wood option to the global catalog."
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
        mode="create"
        loading={mutation.isPending}
        onSubmit={(payload) =>
          mutation.mutateAsync(payload as CreateWoodPayload)
        }
      />
    </div>
  );
}
