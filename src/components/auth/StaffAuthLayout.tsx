import type { ReactNode } from "react";
import { Package, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const highlights = [
  {
    icon: Package,
    title: "Catalogue control",
    copy: "Products, categories, and inventory in one workspace.",
  },
  {
    icon: Sparkles,
    title: "Order clarity",
    copy: "Track fulfilment, payments, and customer activity live.",
  },
  {
    icon: ShieldCheck,
    title: "Staff-only access",
    copy: "Role-based permissions for your operations team.",
  },
];

type StaffAuthLayoutProps = {
  mobileTitle: string;
  mobileSubtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function StaffAuthLayout({
  mobileTitle,
  mobileSubtitle,
  children,
  footer,
}: StaffAuthLayoutProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#faf8f5]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(107, 78, 61, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(107, 78, 61, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="relative hidden overflow-hidden bg-[#2c2419] text-[#faf8f5] lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-16 size-72 rounded-full bg-[#a67c52]/20 blur-3xl animate-[login-float_18s_ease-in-out_infinite]" />
            <div className="absolute right-0 bottom-0 size-96 rounded-full bg-[#6b4e3d]/30 blur-3xl animate-[login-float_22s_ease-in-out_infinite_reverse]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(166,124,82,0.18),transparent_45%)]" />
          </div>

          <div className="relative z-10 flex items-center gap-3 p-10">
            <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold backdrop-blur-sm">
              CF
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">
                Chaya Furnitures
              </p>
              <p className="text-sm text-[#faf8f5]/65">Operations console</p>
            </div>
          </div>

          <div className="relative z-10 max-w-xl space-y-8 px-10 pb-4">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#faf8f5]/70">
                Staff workspace
              </p>
              <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight xl:text-5xl">
                Run the store
                <span className="block text-[#d4c4b0]">with precision.</span>
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-[#faf8f5]/72">
                A calm command centre for furniture merchandising, order
                fulfilment, and customer care — built for your team.
              </p>
            </div>

            <div className="space-y-3">
              {highlights.map((item, index) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-4 backdrop-blur-sm animate-[login-rise_0.7s_ease-out_both]"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#6b4e3d]/50 text-[#f3ede6]">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#faf8f5]/60">
                      {item.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 px-10 pb-10 text-xs text-[#faf8f5]/45">
            Authorized personnel only. Activity may be audited.
          </p>
        </section>

        <section className="relative flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-105 animate-[login-rise_0.65s_ease-out_both]">
            <div className="mb-8 space-y-3 lg:hidden">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#6b4e3d] text-sm font-semibold text-white">
                CF
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {mobileTitle}
                </h1>
                <p className="text-sm text-muted-foreground">{mobileSubtitle}</p>
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-border/80 bg-card/80 p-6",
                "shadow-[0_24px_80px_-32px_rgba(44,36,25,0.18)] backdrop-blur-sm sm:p-8",
              )}
            >
              {children}
            </div>

            {footer}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes login-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -18px, 0) scale(1.04); }
        }
        @keyframes login-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
