import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  Film,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { downloadInstagramInsightsPdf } from "@/lib/instagram-insights-pdf";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { getInstagramMediaInsights } from "@/services/instagram.service";
import type { InstagramMediaInsights } from "@/types/instagram";

type SectionId = "overview" | "reach" | "engagement" | "watch" | "details";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "reach", label: "Reach" },
  { id: "engagement", label: "Engagement" },
  { id: "watch", label: "Watch time" },
  { id: "details", label: "Details" },
];

function formatCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSeconds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value < 60) return `${value.toFixed(1)}s`;
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatPostedAt(timestamp: string | undefined): string {
  if (!timestamp) return "Unknown date";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scrollToSection(id: SectionId) {
  document.getElementById(`insights-${id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

const performanceConfig = {
  value: { label: "Value", color: "#8B5E3C" },
} satisfies ChartConfig;

const watchConfig = {
  value: { label: "Seconds", color: "#C4A484" },
} satisfies ChartConfig;

const pieConfig = {
  likes: { label: "Likes", color: "#8B5E3C" },
  comments: { label: "Comments", color: "#C4A484" },
  shares: { label: "Shares", color: "#3D2B1F" },
  saved: { label: "Saved", color: "#A67C52" },
} satisfies ChartConfig;

const PIE_COLORS = ["#8B5E3C", "#C4A484", "#3D2B1F", "#A67C52"];

type MetricCardProps = {
  label: string;
  value: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  active?: boolean;
  onClick?: () => void;
};

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  accent = "bg-[#8B5E3C]/10 text-[#8B5E3C]",
  active = false,
  onClick,
}: MetricCardProps) {
  const interactive = Boolean(onClick);
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      className={cn(
        "group rounded-2xl border bg-card p-4 text-left transition duration-200",
        interactive && "hover:-translate-y-0.5 hover:border-[#C9B59A] hover:shadow-md",
        active && "border-[#8B5E3C] shadow-md ring-1 ring-[#8B5E3C]/30",
        !interactive && "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#3D2B1F]">
            {value}
          </p>
          {description ? (
            <p className="text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition",
            accent,
            active && "scale-105",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </button>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-[#3D2B1F]">{title}</h2>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

function engagementRate(data: InstagramMediaInsights): number | null {
  const views = data.metrics.views;
  const interactions = data.metrics.total_interactions;
  if (views == null || views <= 0 || interactions == null) return null;
  return interactions / views;
}

function performanceBarData(data: InstagramMediaInsights) {
  return [
    { key: "reach", name: "Reach", value: data.metrics.reach ?? 0 },
    { key: "views", name: "Views", value: data.metrics.views ?? 0 },
    { key: "likes", name: "Likes", value: data.metrics.likes ?? 0 },
    { key: "comments", name: "Comments", value: data.metrics.comments ?? 0 },
    { key: "shares", name: "Shares", value: data.metrics.shares ?? 0 },
    { key: "saved", name: "Saved", value: data.metrics.saved ?? 0 },
    {
      key: "replays",
      name: "Replays",
      value: data.metrics.clips_replays_count ?? 0,
    },
  ];
}

function watchBarData(data: InstagramMediaInsights) {
  return [
    {
      name: "Avg watch",
      value: data.watchTime.avgWatchTimeSeconds ?? 0,
    },
    {
      name: "Total watch",
      value: data.watchTime.totalWatchTimeSeconds ?? 0,
    },
  ];
}

function interactionPieData(data: InstagramMediaInsights) {
  return [
    { name: "likes", label: "Likes", value: data.metrics.likes ?? 0 },
    { name: "comments", label: "Comments", value: data.metrics.comments ?? 0 },
    { name: "shares", label: "Shares", value: data.metrics.shares ?? 0 },
    { name: "saved", label: "Saved", value: data.metrics.saved ?? 0 },
  ].filter((row) => row.value > 0);
}

export function InstagramMediaReportPage() {
  const { mediaId: rawMediaId } = useParams<{ mediaId: string }>();
  const mediaId = rawMediaId ? decodeURIComponent(rawMediaId) : "";
  const [activeMetric, setActiveMetric] = useState<string | null>("views");
  const [activePie, setActivePie] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const insightsQuery = useQuery({
    queryKey: queryKeys.admin.instagram.insights(mediaId),
    queryFn: () => getInstagramMediaInsights(mediaId),
    enabled: mediaId.length > 0,
  });

  const data = insightsQuery.data;
  const media = data?.media;
  const is503 =
    insightsQuery.error instanceof ApiError &&
    insightsQuery.error.statusCode === 503;

  function handleDownloadPdf() {
    if (!data) return;
    setDownloadingPdf(true);
    try {
      downloadInstagramInsightsPdf(data);
      toast.success("Insights PDF downloaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to download PDF",
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  const pieData = useMemo(
    () => (data ? interactionPieData(data) : []),
    [data],
  );
  const barData = useMemo(
    () => (data ? performanceBarData(data) : []),
    [data],
  );
  const watchData = useMemo(() => (data ? watchBarData(data) : []), [data]);
  const rate = data ? engagementRate(data) : null;
  const skipRate = data?.metrics.reels_skip_rate ?? null;
  const pieTotal = pieData.reduce((sum, row) => sum + row.value, 0);
  const maxBar = Math.max(...barData.map((row) => row.value), 1);
  const maxInsight = Math.max(
    ...(data?.insights ?? []).map((item) =>
      item.name === "reels_skip_rate" ? (item.value ?? 0) * 100 : (item.value ?? 0),
    ),
    1,
  );

  const radialData = [
    {
      name: "engagement",
      value: Math.min(100, Math.max(0, (rate ?? 0) * 100)),
      fill: "#8B5E3C",
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Reel insights"
        description="Lifetime report with reach, engagement, and watch-time breakdown."
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/content/instagram"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <ArrowLeft className="size-4" />
              All posts
            </Link>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={!data || downloadingPdf || insightsQuery.isLoading}
            >
              {downloadingPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh insights"
              onClick={() => void insightsQuery.refetch()}
              disabled={insightsQuery.isFetching || !mediaId}
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  insightsQuery.isFetching && "animate-spin",
                )}
              />
            </Button>
          </div>
        }
      />

      {!mediaId ? (
        <EmptyState
          icon={Film}
          title="Missing media"
          description="No Instagram media ID was provided."
        />
      ) : insightsQuery.isLoading ? (
        <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20">
          <Loader2 className="size-7 animate-spin text-[#8B5E3C]" />
          <p className="text-sm text-muted-foreground">
            Loading Instagram insights…
          </p>
        </div>
      ) : insightsQuery.isError ? (
        <EmptyState
          icon={Film}
          title="Could not load insights"
          description={
            is503
              ? "Insights unavailable — Instagram token missing, or this media does not support Reel insights."
              : insightsQuery.error instanceof Error
                ? insightsQuery.error.message
                : "Something went wrong."
          }
        />
      ) : data ? (
        <>
          <div className="sticky top-0 z-20 -mx-1 border-b bg-background/90 px-1 py-2 backdrop-blur">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id);
                    scrollToSection(section.id);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                    activeSection === section.id
                      ? "bg-[#3D2B1F] text-white"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          <section id="insights-overview" className="scroll-mt-16 space-y-4">
            <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-[#F7F1EA] via-background to-[#EFE6DB]">
              <div className="grid gap-6 p-5 md:grid-cols-[1.4fr_0.8fr] md:p-7">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B5E3C]/12 px-2.5 py-1 text-xs font-medium text-[#8B5E3C]">
                      <Sparkles className="size-3.5" />
                      Insights report
                    </span>
                    {media?.media_type ? (
                      <StatusBadge variant="neutral">
                        {media.media_type}
                      </StatusBadge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {formatPostedAt(media?.timestamp)}
                    </span>
                  </div>
                  <h3 className="max-w-2xl text-xl font-semibold leading-snug text-[#3D2B1F] md:text-2xl">
                    {media?.caption?.trim() || "Untitled reel"}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Heart className="size-3.5 text-[#8B5E3C]" />
                      {formatCount(media?.like_count)} likes
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle className="size-3.5 text-[#8B5E3C]" />
                      {formatCount(media?.comments_count)} comments
                    </span>
                  </div>
                  {media?.permalink ? (
                    <a
                      href={media.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8B5E3C] transition hover:underline"
                    >
                      Open on Instagram
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                  <div className="rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Engagement rate
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <p className="text-3xl font-semibold tabular-nums text-[#3D2B1F]">
                        {formatPercent(rate)}
                      </p>
                      <ChartContainer
                        config={{
                          value: { label: "Rate", color: "#8B5E3C" },
                        }}
                        className="h-16 w-16"
                      >
                        <RadialBarChart
                          data={radialData}
                          startAngle={90}
                          endAngle={-270}
                          innerRadius="68%"
                          outerRadius="100%"
                        >
                          <RadialBar dataKey="value" background cornerRadius={8} />
                        </RadialBarChart>
                      </ChartContainer>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Interactions ÷ views
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Skip rate
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums text-[#3D2B1F]">
                      {formatPercent(skipRate)}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#8B5E3C] transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, (skipRate ?? 0) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Lower is better retention
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="insights-reach" className="scroll-mt-16 space-y-4">
            <SectionHeading
              title="Reach & playback"
              subtitle="How far the reel traveled and how often it was replayed"
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Reach"
                value={formatCompact(data.metrics.reach)}
                description="Unique accounts that saw this reel"
                icon={Users}
                active={activeMetric === "reach"}
                onClick={() => setActiveMetric("reach")}
              />
              <MetricCard
                label="Views"
                value={formatCompact(data.metrics.views)}
                description="Total reel plays"
                icon={Eye}
                active={activeMetric === "views"}
                onClick={() => setActiveMetric("views")}
              />
              <MetricCard
                label="Replays"
                value={formatCompact(data.metrics.clips_replays_count)}
                description="Times the reel was replayed"
                icon={RefreshCw}
                active={activeMetric === "replays"}
                onClick={() => setActiveMetric("replays")}
              />
              <MetricCard
                label="Skip rate"
                value={formatPercent(data.metrics.reels_skip_rate)}
                description="Viewers who skipped early"
                icon={Sparkles}
              />
            </div>
          </section>

          <section id="insights-engagement" className="scroll-mt-16 space-y-4">
            <SectionHeading
              title="Engagement"
              subtitle="Tap a metric to highlight it in the performance chart"
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Likes"
                value={formatCompact(data.metrics.likes)}
                icon={Heart}
                active={activeMetric === "likes"}
                onClick={() => setActiveMetric("likes")}
              />
              <MetricCard
                label="Comments"
                value={formatCompact(data.metrics.comments)}
                icon={MessageCircle}
                active={activeMetric === "comments"}
                onClick={() => setActiveMetric("comments")}
              />
              <MetricCard
                label="Shares"
                value={formatCompact(data.metrics.shares)}
                icon={Share2}
                active={activeMetric === "shares"}
                onClick={() => setActiveMetric("shares")}
              />
              <MetricCard
                label="Saved"
                value={formatCompact(data.metrics.saved)}
                icon={Bookmark}
                active={activeMetric === "saved"}
                onClick={() => setActiveMetric("saved")}
              />
              <MetricCard
                label="Interactions"
                value={formatCompact(data.metrics.total_interactions)}
                description="All engagement actions"
                icon={Sparkles}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="overflow-hidden border-none bg-card shadow-sm ring-1 ring-border/60 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Performance snapshot</CardTitle>
                  <CardDescription>
                    Compare reach and engagement at a glance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={performanceConfig}
                    className="h-80 w-full"
                  >
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ left: 8, right: 12 }}
                      accessibilityLayer
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={78}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                        {barData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={
                              activeMetric === entry.key ? "#3D2B1F" : "#8B5E3C"
                            }
                            fillOpacity={
                              activeMetric == null || activeMetric === entry.key
                                ? 1
                                : 0.35
                            }
                            className="transition-opacity duration-200"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none bg-card shadow-sm ring-1 ring-border/60 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Interaction mix</CardTitle>
                  <CardDescription>
                    Hover a slice to focus that action
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                      No interaction breakdown available
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <ChartContainer config={pieConfig} className="mx-auto h-56 w-full">
                        <PieChart>
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                nameKey="label"
                                labelKey="label"
                              />
                            }
                          />
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={58}
                            outerRadius={88}
                            paddingAngle={3}
                            onMouseEnter={(_, index) =>
                              setActivePie(pieData[index]?.name ?? null)
                            }
                            onMouseLeave={() => setActivePie(null)}
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                fillOpacity={
                                  activePie == null || activePie === entry.name
                                    ? 1
                                    : 0.35
                                }
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <text
                            x="50%"
                            y="48%"
                            textAnchor="middle"
                            className="fill-foreground text-lg font-semibold"
                          >
                            {formatCompact(pieTotal)}
                          </text>
                          <text
                            x="50%"
                            y="58%"
                            textAnchor="middle"
                            className="fill-muted-foreground text-[11px]"
                          >
                            actions
                          </text>
                        </PieChart>
                      </ChartContainer>
                      <ul className="grid grid-cols-2 gap-2">
                        {pieData.map((entry, index) => {
                          const share =
                            pieTotal > 0
                              ? Math.round((entry.value / pieTotal) * 100)
                              : 0;
                          return (
                            <li key={entry.name}>
                              <button
                                type="button"
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                                  activePie === entry.name
                                    ? "border-[#8B5E3C] bg-[#8B5E3C]/5"
                                    : "hover:bg-muted/50",
                                )}
                                onMouseEnter={() => setActivePie(entry.name)}
                                onMouseLeave={() => setActivePie(null)}
                                onClick={() =>
                                  setActiveMetric(
                                    entry.name === "likes"
                                      ? "likes"
                                      : entry.name === "comments"
                                        ? "comments"
                                        : entry.name === "shares"
                                          ? "shares"
                                          : "saved",
                                  )
                                }
                              >
                                <span
                                  className="size-2.5 rounded-full"
                                  style={{
                                    background:
                                      PIE_COLORS[index % PIE_COLORS.length],
                                  }}
                                />
                                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                  {entry.label}
                                </span>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {share}%
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="insights-watch" className="scroll-mt-16 space-y-4">
            <SectionHeading
              title="Watch time"
              subtitle="How long people stayed with the reel"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Avg watch time"
                value={formatSeconds(data.watchTime.avgWatchTimeSeconds)}
                description="Average seconds watched per play"
                icon={Clock3}
                accent="bg-[#C4A484]/20 text-[#8B5E3C]"
              />
              <MetricCard
                label="Total watch time"
                value={formatSeconds(data.watchTime.totalWatchTimeSeconds)}
                description="Sum of all watch time"
                icon={Clock3}
                accent="bg-[#C4A484]/20 text-[#8B5E3C]"
              />
            </div>
            <Card className="overflow-hidden border-none bg-card shadow-sm ring-1 ring-border/60">
              <CardHeader>
                <CardTitle>Watch time comparison</CardTitle>
                <CardDescription>
                  Average vs total watch time in seconds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={watchConfig} className="h-64 w-full">
                  <BarChart data={watchData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={48} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      radius={[10, 10, 0, 0]}
                      barSize={56}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </section>

          <section id="insights-details" className="scroll-mt-16 space-y-4">
            <SectionHeading
              title="Metric details"
              subtitle="Full Graph insights with relative scale bars"
            />
            <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border/60">
              <CardContent className="divide-y p-0">
                {(data.insights ?? []).length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    No detailed insight rows returned for this media.
                  </p>
                ) : (
                  data.insights.map((insight) => {
                    const numeric =
                      insight.name === "reels_skip_rate"
                        ? (insight.value ?? 0) * 100
                        : (insight.value ?? 0);
                    const width = Math.max(
                      4,
                      Math.round((numeric / maxInsight) * 100),
                    );
                    return (
                      <div
                        key={`${insight.name}-${insight.period}`}
                        className="space-y-2 px-4 py-4 transition hover:bg-muted/30 sm:px-5"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-medium text-[#3D2B1F]">
                              {insight.title || insight.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {insight.description || insight.name}
                              {insight.period ? ` · ${insight.period}` : ""}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold tabular-nums text-[#3D2B1F]">
                            {insight.name === "reels_skip_rate"
                              ? formatPercent(insight.value)
                              : formatCount(insight.value)}
                          </p>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#8B5E3C]/80 transition-all duration-500"
                            style={{ width: `${Math.min(100, width)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              Highlighted metric in the chart:{" "}
              <span className="font-medium text-foreground">
                {activeMetric
                  ? barData.find((row) => row.key === activeMetric)?.name ??
                    activeMetric
                  : "None"}
              </span>
              {maxBar > 0 ? (
                <>
                  {" "}
                  · Peak value in snapshot:{" "}
                  <span className="font-medium text-foreground">
                    {formatCount(maxBar)}
                  </span>
                </>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
