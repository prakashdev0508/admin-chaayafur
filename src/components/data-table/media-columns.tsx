import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { MediaItem, MediaVendor } from "@/types/media";

export type MediaVendorRowActions = {
  canUpdate: boolean;
  canDelete: boolean;
  pendingId: number | null;
  onEdit: (vendor: MediaVendor) => void;
  onToggleActive: (vendor: MediaVendor) => void;
  onDelete: (vendor: MediaVendor) => void;
};

export type MediaItemRowActions = {
  canUpdate: boolean;
  canDelete: boolean;
  pendingId: number | null;
  onEdit: (item: MediaItem) => void;
  onToggleActive: (item: MediaItem) => void;
  onToggleHome: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
};

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge variant={isActive ? "success" : "neutral"}>
      {isActive ? "Active" : "Hidden"}
    </StatusBadge>
  );
}

export function createMediaVendorColumns(
  actions: MediaVendorRowActions,
): ColumnDef<MediaVendor>[] {
  const columns: ColumnDef<MediaVendor>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) => (
        <img
          src={row.original.imageUrl}
          alt=""
          className="size-10 rounded-md border object-cover"
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="font-medium">{row.original.name}</p>
          {row.original.description ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "items",
      header: "Coverage",
      cell: ({ row }) => row.original.mediaItemsCount ?? 0,
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <ActiveBadge isActive={row.original.isActive} />,
    },
  ];

  if (actions.canUpdate || actions.canDelete) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const vendor = row.original;
        const pending = actions.pendingId === vendor.id;
        return (
          <div className="flex justify-end gap-1">
            {actions.canUpdate ? (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={vendor.isActive ? "Hide vendor" : "Show vendor"}
                  disabled={pending}
                  onClick={() => actions.onToggleActive(vendor)}
                >
                  {vendor.isActive ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit vendor"
                  onClick={() => actions.onEdit(vendor)}
                >
                  <Pencil className="size-4" />
                </Button>
              </>
            ) : null}
            {actions.canDelete ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete vendor"
                onClick={() => actions.onDelete(vendor)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        );
      },
    });
  }

  return columns;
}

export function createMediaItemColumns(
  actions: MediaItemRowActions,
): ColumnDef<MediaItem>[] {
  const columns: ColumnDef<MediaItem>[] = [
    {
      id: "cover",
      header: "",
      cell: ({ row }) => (
        <img
          src={row.original.coverImageUrl}
          alt=""
          className="h-10 w-16 rounded-md border object-cover"
        />
      ),
    },
    {
      id: "description",
      header: "Coverage",
      cell: ({ row }) => (
        <div className="min-w-[200px] max-w-[360px]">
          <p className="line-clamp-2 text-sm">{row.original.description}</p>
          <a
            href={row.original.link}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            <ExternalLink className="size-3" />
            Open link
          </a>
        </div>
      ),
    },
    {
      id: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor?.name ?? "—",
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
    },
    {
      id: "home",
      header: "Home",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.showOnHome ? "brand" : "neutral"}>
          {row.original.showOnHome ? "On home" : "Off"}
        </StatusBadge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <ActiveBadge isActive={row.original.isActive} />,
    },
  ];

  if (actions.canUpdate || actions.canDelete) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        const pending = actions.pendingId === item.id;
        return (
          <div className="flex justify-end gap-1">
            {actions.canUpdate ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  disabled={pending}
                  onClick={() => actions.onToggleHome(item)}
                >
                  {item.showOnHome ? "Remove home" : "Show on home"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={item.isActive ? "Hide coverage" : "Show coverage"}
                  disabled={pending}
                  onClick={() => actions.onToggleActive(item)}
                >
                  {item.isActive ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit coverage"
                  onClick={() => actions.onEdit(item)}
                >
                  <Pencil className="size-4" />
                </Button>
              </>
            ) : null}
            {actions.canDelete ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete coverage"
                onClick={() => actions.onDelete(item)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        );
      },
    });
  }

  return columns;
}
