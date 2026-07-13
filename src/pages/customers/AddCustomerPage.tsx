import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { queryKeys } from "@/lib/query-keys";
import { createCustomer } from "@/services/customers.service";
import type { CreateCustomerPayload } from "@/types/customer";

export function AddCustomerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success("Customer created");
      navigate(`/customers/${customer.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create customer",
      );
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Add customer"
        description="Create a new customer account by phone number."
        action={
          <Button
            variant="outline"
            render={
              <Link to="/customers">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            }
          />
        }
      />
      <CustomerForm
        loading={mutation.isPending}
        onSubmit={(payload) => mutation.mutateAsync(payload)}
      />
    </div>
  );
}
