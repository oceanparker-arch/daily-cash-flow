import { RefreshCw } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type IssueSeverity = "danger" | "warning";
type IssueType =
  | "Missing Payment File"
  | "Payment File / Balancing Sheet Mismatch"
  | "Blank Balancing Sheet"
  | "Reconciliation Difference";
type AgentStatus = "issue" | "warning" | "ok";

type IssueFlag = {
  agent: string;
  platform: "ALTO" | "STREET";
  type: IssueType;
  severity: IssueSeverity;
  detail: string;
};

type BatchAgent = {
  agent: string;
  holdingTransfer: number;
  cboTotal: number;
  cboManualPayments: number;
  reconciliationDifference: number;
};

type ThirdPartyAgent = {
  agent: string;
  platform: "ALTO" | "STREET";
  holdingTransfer: number;
  cboTotal: number;
  cboManualPayments: number;
  reconciliationDifference: number;
  status: AgentStatus;
};

const issueFlags: IssueFlag[] = [
  {
    agent: "Kingsley Finance",
    platform: "ALTO",
    type: "Missing Payment File",
    severity: "danger",
    detail: "Expected daily payment file has not been received for today's run.",
  },
  {
    agent: "Harbour & Co",
    platform: "STREET",
    type: "Payment File / Balancing Sheet Mismatch",
    severity: "danger",
    detail: "Payment file total £12,450.00 — Balancing sheet total £12,200.00.",
  },
  {
    agent: "Cedar Residential",
    platform: "ALTO",
    type: "Blank Balancing Sheet",
    severity: "warning",
    detail: "Payment file exists but the balancing sheet contains no transaction values.",
  },
  {
    agent: "Northpoint Estates",
    platform: "STREET",
    type: "Reconciliation Difference",
    severity: "warning",
    detail: "Difference: -£250.00.",
  },
];

const batchAgents: BatchAgent[] = [
  { agent: "Batch Alpha", holdingTransfer: 18450, cboTotal: 17200, cboManualPayments: 1250, reconciliationDifference: 0 },
  { agent: "Batch Bravo", holdingTransfer: 22340, cboTotal: 21090, cboManualPayments: 1250, reconciliationDifference: 0 },
  { agent: "Batch Charlie", holdingTransfer: 19890, cboTotal: 18940, cboManualPayments: 950, reconciliationDifference: 0 },
  { agent: "Batch Delta", holdingTransfer: 24075, cboTotal: 22975, cboManualPayments: 1100, reconciliationDifference: 0 },
  { agent: "Batch Echo", holdingTransfer: 21110, cboTotal: 20010, cboManualPayments: 1100, reconciliationDifference: 0 },
];

const thirdPartyAgents: ThirdPartyAgent[] = [
  { agent: "Kingsley Finance", platform: "ALTO", holdingTransfer: 0, cboTotal: 0, cboManualPayments: 0, reconciliationDifference: 0, status: "issue" },
  { agent: "Harbour & Co", platform: "STREET", holdingTransfer: 12450, cboTotal: 12200, cboManualPayments: 0, reconciliationDifference: 250, status: "issue" },
  { agent: "Cedar Residential", platform: "ALTO", holdingTransfer: 9135, cboTotal: 9135, cboManualPayments: 0, reconciliationDifference: 0, status: "warning" },
  { agent: "Northpoint Estates", platform: "STREET", holdingTransfer: 17680, cboTotal: 17430, cboManualPayments: 0, reconciliationDifference: -250, status: "warning" },
  { agent: "Bromley Lettings", platform: "ALTO", holdingTransfer: 14320, cboTotal: 14320, cboManualPayments: 0, reconciliationDifference: 0, status: "ok" },
  { agent: "Meridian Block Mgmt", platform: "STREET", holdingTransfer: 20875, cboTotal: 20225, cboManualPayments: 650, reconciliationDifference: 0, status: "ok" },
  { agent: "Oakwell Property", platform: "ALTO", holdingTransfer: 11640, cboTotal: 11240, cboManualPayments: 400, reconciliationDifference: 0, status: "ok" },
  { agent: "Redbridge Living", platform: "STREET", holdingTransfer: 15890, cboTotal: 15890, cboManualPayments: 0, reconciliationDifference: 0, status: "ok" },
  { agent: "Sterling Homes", platform: "ALTO", holdingTransfer: 13260, cboTotal: 12960, cboManualPayments: 300, reconciliationDifference: 0, status: "ok" },
  { agent: "Westcourt Management", platform: "STREET", holdingTransfer: 18710, cboTotal: 18010, cboManualPayments: 700, reconciliationDifference: 0, status: "ok" },
];

const severityOrder: Record<IssueSeverity, number> = { danger: 0, warning: 1 };
const statusOrder: Record<AgentStatus, number> = { issue: 0, warning: 1, ok: 2 };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const todayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

const lastRefreshLabel = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date());

const batchSummary = batchAgents.reduce(
  (totals, agent) => ({
    holdingTransfer: totals.holdingTransfer + agent.holdingTransfer,
    cboTotal: totals.cboTotal + agent.cboTotal,
    cboManualPayments: totals.cboManualPayments + agent.cboManualPayments,
    reconciliationDifference: totals.reconciliationDifference + agent.reconciliationDifference,
  }),
  { holdingTransfer: 0, cboTotal: 0, cboManualPayments: 0, reconciliationDifference: 0 },
);

const sortedFlags = [...issueFlags].sort(
  (a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.agent.localeCompare(b.agent),
);

const sortedAgents = [...thirdPartyAgents].sort(
  (a, b) => statusOrder[a.status] - statusOrder[b.status] || a.agent.localeCompare(b.agent),
);

const issueCounts = {
  issues: sortedFlags.length,
  agents: new Set(sortedFlags.map((flag) => flag.agent)).size,
};

const overallStatus = sortedFlags.some((flag) => flag.severity === "danger")
  ? {
      tone: "danger" as const,
      label: "Action Required",
      summary: `${issueCounts.issues} issues found across ${issueCounts.agents} agents`,
    }
  : sortedFlags.length > 0
    ? {
        tone: "warning" as const,
        label: "Attention Required",
        summary: `${issueCounts.issues} issues found across ${issueCounts.agents} agents`,
      }
    : {
        tone: "success" as const,
        label: "All Clear",
        summary: "All files present, all totals match, no reconciliation differences",
      };

const toneClasses = {
  success: {
    banner: "border-status-success/20 bg-status-success-surface text-status-success-foreground",
    pill: "bg-status-success-surface text-status-success-foreground border-status-success/20",
    dot: "bg-status-success",
    value: "text-status-success",
  },
  warning: {
    banner: "border-status-warning/20 bg-status-warning-surface text-status-warning-foreground",
    pill: "bg-status-warning-surface text-status-warning-foreground border-status-warning/20",
    dot: "bg-status-warning",
    value: "text-status-warning",
  },
  danger: {
    banner: "border-status-danger/20 bg-status-danger-surface text-status-danger-foreground",
    pill: "bg-status-danger-surface text-status-danger-foreground border-status-danger/20",
    dot: "bg-status-danger",
    value: "text-status-danger",
  },
};

const issueTypeTone: Record<IssueType, "danger" | "warning"> = {
  "Missing Payment File": "danger",
  "Payment File / Balancing Sheet Mismatch": "danger",
  "Blank Balancing Sheet": "warning",
  "Reconciliation Difference": "warning",
};

const statusMeta: Record<AgentStatus, { label: string; tone: keyof typeof toneClasses }> = {
  issue: { label: "🔴 Issue", tone: "danger" },
  warning: { label: "🟠 Warning", tone: "warning" },
  ok: { label: "🟢 OK", tone: "success" },
};

const SummaryMetric = ({ label, value, emphasize = false, tone = "default" }: { label: string; value: number; emphasize?: boolean; tone?: "default" | "danger"; }) => (
  <div className="space-y-2 rounded-md border border-border bg-panel-alt p-5">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className={emphasize ? `text-4xl font-semibold ${tone === "danger" ? "text-status-danger" : "text-foreground"}` : "text-4xl font-semibold text-foreground"}>
      {formatCurrency(value)}
    </p>
  </div>
);

const TlpPaymentsDashboard = () => {
  const hasIssues = sortedFlags.length > 0;

  return (
    <main className="min-h-screen bg-app">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-10 rounded-lg border border-border bg-header text-header-foreground shadow-sm">
          <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">TLP Daily Payments Dashboard</h1>
              <div className="flex flex-col gap-1 text-sm text-header-foreground/80 sm:flex-row sm:gap-6">
                <span>Today: {todayLabel}</span>
                <span>Last refreshed: {lastRefreshLabel}</span>
              </div>
            </div>

            <Button variant="toolbar" className="min-w-32 bg-panel text-foreground hover:-translate-y-0.5">
              <RefreshCw className="motion-safe:group-hover:animate-spin-slow" />
              Refresh
            </Button>
          </div>
        </header>

        <section
          aria-label="Overall run status"
          className={`rounded-lg border px-5 py-4 shadow-sm ${toneClasses[overallStatus.tone].banner}`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className={`h-3.5 w-3.5 rounded-full ${toneClasses[overallStatus.tone].dot} ${overallStatus.tone !== "success" ? "motion-safe:animate-soft-pulse" : ""}`} />
              <div>
                <p className="text-lg font-semibold">{overallStatus.label}</p>
                <p className="text-sm opacity-90">{overallStatus.summary}</p>
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="issues" className="space-y-6 pb-4">
          <TabsList className="h-auto w-full justify-start gap-2 rounded-lg border border-border bg-panel p-2">
            <TabsTrigger value="issues" className="gap-2 rounded-md px-4 py-2">
              <span>Issues</span>
              {hasIssues && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${toneClasses[overallStatus.tone === "success" ? "warning" : overallStatus.tone].pill}`}>
                  <span className={`h-2 w-2 rounded-full ${toneClasses[overallStatus.tone === "success" ? "warning" : overallStatus.tone].dot}`} />
                  {issueCounts.issues}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tlp-account-payments" className="rounded-md px-4 py-2">
              TLP Account Payments
            </TabsTrigger>
            <TabsTrigger value="manual-bank-payments" className="rounded-md px-4 py-2">
              Manual Bank Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="mt-0">
            <Card className="border-border bg-panel shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle id="issues-heading" className="text-xl text-foreground">
                  Issues Requiring Attention
                </CardTitle>
                <CardDescription>Items are prioritised by severity to support payment run review.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {hasIssues ? (
                  <ul className="divide-y divide-border">
                    {sortedFlags.map((flag) => {
                      const tone = toneClasses[flag.severity];

                      return (
                        <li key={`${flag.agent}-${flag.type}`} className="flex flex-col gap-3 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex min-w-0 flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">{flag.agent}</span>
                            <span className="inline-flex items-center rounded-full border border-border bg-panel-alt px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              {flag.platform}
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone.pill}`}>
                              {flag.severity === "danger" ? "🔴" : "🟠"} {flag.type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground xl:text-right">{flag.detail}</p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-6 py-8 text-sm text-muted-foreground">No issues currently require attention.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tlp-account-payments" className="mt-0">
            <Card className="border-border bg-panel shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle id="batch-payments-heading" className="text-xl text-foreground">
                  Batch Payments
                </CardTitle>
                <CardDescription>Combined totals across all batch payment agents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryMetric label="Holding Account Transfer (£)" value={batchSummary.holdingTransfer} emphasize />
                  <SummaryMetric label="CBO Total (£)" value={batchSummary.cboTotal} emphasize />
                  <SummaryMetric label="CBO Manual Payments (£)" value={batchSummary.cboManualPayments} emphasize />
                  <SummaryMetric
                    label="Reconciliation Difference (£)"
                    value={batchSummary.reconciliationDifference}
                    emphasize
                    tone={batchSummary.reconciliationDifference !== 0 ? "danger" : "default"}
                  />
                </div>

                <div className="border-t border-border pt-5">
                  <div className="mb-3 text-sm font-medium text-muted-foreground">Contributing batch agents</div>
                  <ul className="space-y-2 pl-4">
                    {batchAgents.map((agent) => (
                      <li key={agent.agent} className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-foreground">{agent.agent}</span>
                        <span className="tabular-nums text-muted-foreground">{formatCurrency(agent.holdingTransfer)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual-bank-payments" className="mt-0">
            <Card className="border-border bg-panel shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle id="third-party-heading" className="text-xl text-foreground">
                  Third Party Accounts
                </CardTitle>
                <CardDescription>Issue and warning rows are surfaced first for operational review.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="min-w-[1100px]">
                    <div className="grid grid-cols-[120px_minmax(220px,1.4fr)_120px_repeat(4,minmax(150px,1fr))] border-b border-border bg-panel px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <span>Status</span>
                      <span>Agent</span>
                      <span>Platform</span>
                      <span>Holding Account Transfer</span>
                      <span>CBO Total</span>
                      <span>CBO Manual Payments</span>
                      <span>Reconciliation Difference</span>
                    </div>

                    {sortedAgents.map((agent, index) => {
                      const meta = statusMeta[agent.status];
                      const tone = toneClasses[meta.tone];
                      const hasReconDifference = agent.reconciliationDifference !== 0;

                      return (
                        <div
                          key={agent.agent}
                          className={`grid grid-cols-[120px_minmax(220px,1.4fr)_120px_repeat(4,minmax(150px,1fr))] items-center border-b border-border px-6 py-4 text-sm ${index % 2 === 0 ? "bg-panel" : "bg-panel-alt/60"}`}
                        >
                          <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone.pill}`}>
                            {meta.label}
                          </span>
                          <span className="font-semibold text-foreground">{agent.agent}</span>
                          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{agent.platform}</span>
                          <span className="tabular-nums text-foreground">{formatCurrency(agent.holdingTransfer)}</span>
                          <span className="tabular-nums text-foreground">{formatCurrency(agent.cboTotal)}</span>
                          <span className="tabular-nums text-foreground">{formatCurrency(agent.cboManualPayments)}</span>
                          <span className={`tabular-nums font-semibold ${hasReconDifference ? "text-status-danger" : "text-status-success"}`}>
                            {formatCurrency(agent.reconciliationDifference)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default TlpPaymentsDashboard;