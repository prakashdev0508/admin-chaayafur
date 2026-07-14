import { useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, User } from "lucide-react";
import { ShopAnnouncementBar } from "@/components/shop/ShopAnnouncementBar";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { buttonVariants } from "@/components/ui/button";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { fetchPublicSiteSettings } from "@/services/site-settings.service";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors hover:text-foreground",
    isActive ? "text-foreground" : "text-muted-foreground",
  );

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function ShopLayout() {
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useCustomerAuth();

  const siteSettingsQuery = useQuery({
    queryKey: queryKeys.shop.siteSettings,
    queryFn: fetchPublicSiteSettings,
    staleTime: 60_000,
  });

  const settings = siteSettingsQuery.data;

  useEffect(() => {
    if (!settings?.faviconUrl) return;

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.faviconUrl;

    return () => {
      if (link) {
        link.href = "/favicon.svg";
      }
    };
  }, [settings?.faviconUrl]);

  const socialLinks = settings?.socialLinks ?? {};
  const hasFooterContact = Boolean(
    settings?.phone ||
      settings?.email ||
      settings?.whatsapp ||
      settings?.showroomAddress ||
      settings?.businessHours ||
      Object.values(socialLinks).some(Boolean),
  );

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-foreground">
      <header className="sticky top-0 z-40 border-b border-[#E8DFD3] bg-[#FAF7F2]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/shop" className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Chaaya Furnitures"
                className="h-8 max-w-[160px] object-contain object-left"
              />
            ) : (
              <span className="font-serif text-xl tracking-tight text-[#3D2B1F]">
                Chaaya Furnitures
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/shop" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/shop/products" className={navLinkClass}>
              Products
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={isAuthenticated ? "/shop/account" : "/shop/cart?login=1"}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <User className="size-4" />
              <span className="hidden sm:inline">
                {isAuthenticated && user ? formatPhone(user.phone) : "Login"}
              </span>
            </Link>

            <Link
              to="/shop/cart"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "relative border-[#D9CBB8]",
              )}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-[#8B5E3C] text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {settings?.announcement && (
        <ShopAnnouncementBar announcement={settings.announcement} />
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-[#E8DFD3] bg-[#F3EBE0]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {hasFooterContact && (
            <div className="mb-6 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="space-y-2">
                {settings?.showroomAddress && (
                  <p>{settings.showroomAddress}</p>
                )}
                {settings?.businessHours && (
                  <p>{settings.businessHours}</p>
                )}
              </div>
              <div className="space-y-2">
                {settings?.phone && (
                  <p>
                    Phone:{" "}
                    <a
                      href={`tel:${settings.phone}`}
                      className="hover:text-foreground"
                    >
                      {formatPhone(settings.phone)}
                    </a>
                  </p>
                )}
                {settings?.email && (
                  <p>
                    Email:{" "}
                    <a
                      href={`mailto:${settings.email}`}
                      className="hover:text-foreground"
                    >
                      {settings.email}
                    </a>
                  </p>
                )}
                {settings?.whatsapp && (
                  <p>
                    WhatsApp:{" "}
                    <a
                      href={whatsappHref(settings.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground"
                    >
                      {formatPhone(settings.whatsapp)}
                    </a>
                  </p>
                )}
                {Object.entries(socialLinks).some(([, url]) => url) && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {Object.entries(socialLinks).map(([name, url]) =>
                      url ? (
                        <a
                          key={name}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="capitalize hover:text-foreground"
                        >
                          {name}
                        </a>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-[#E8DFD3]/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Chaaya Furnitures</p>
            <div className="flex gap-4">
              <Link to="/shop/products" className="hover:text-foreground">
                Shop
              </Link>
              <Link to="/login" className="hover:text-foreground">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
