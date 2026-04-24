import { useMemo, useState } from "react";
import { Check, ChevronDown, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";

const CUTOFF_HOUR = 16;
const CUTOFF_MINUTE = 30;

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

type ThirdPartyAgent = {
  agent: string;
  platform: string;
  holdingTransfer: number;
  cboTotal: number;
  cboManualPayments: number;
  reconciliationDifference: number;
  status: AgentStatus;
};

type SoftwareGroup = {
  software: string;
  balancingSheetTotal: number;
  paymentFileTotal: number;
  cboTotal: number;
  cboManualPayments: number;
  hasPaymentFile: boolean;
};

type BatchGroup = {
  software: string;
  balancingSheetTotal: number;
  paymentFileTotal: number;
  cboTotal: number;
  cboManualPayments: number;
  hasPaymentFile: boolean;
};

type HoldingTransferAgent = {
  agent: string;
  holdingTransfer: number;
  platform: string;
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

const thirdPartyAgents: ThirdPartyAgent[] = [
  { agent: "Kingsley Finance", platform: "Alto", holdingTransfer: 0, cboTotal: 0, cboManualPayments: 0, reconciliationDifference: 0, status: "issue" },
  { agent: "Harbour & Co", platform: "Street", holdingTransfer: 12450, cboTotal: 12200, cboManualPayments: 0, reconciliationDifference: 250, status: "issue" },
  { agent: "Cedar Residential", platform: "Jupix", holdingTransfer: 9135, cboTotal: 9135, cboManualPayments: 0, reconciliationDifference: 0, status: "warning" },
  { agent: "Northpoint Estates", platform: "SME", holdingTransfer: 17680, cboTotal: 17430, cboManualPayments: 0, reconciliationDifference: -250, status: "warning" },
  { agent: "Bromley Lettings", platform: "10Ninety", holdingTransfer: 14320, cboTotal: 14320, cboManualPayments: 0, reconciliationDifference: 0, status: "ok" },
  { agent: "Meridian Block Mgmt", platform: "Acquaint", holdingTransfer: 20875, cboTotal: 20225, cboManualPayments: 650, reconciliationDifference: 0, status: "ok" },
  { agent: "Oakwell Property", platform: "Genie", holdingTransfer: 11640, cboTotal: 11240, cboManualPayments: 400, reconciliationDifference: 0, status: "ok" },
  { agent: "Redbridge Living", platform: "Veco", holdingTransfer: 15890, cboTotal: 15890, cboManualPayments: 0, reconciliationDifference: 0, status: "ok" },
  { agent: "Sterling Homes", platform: "Reapit", holdingTransfer: 13260, cboTotal: 12960, cboManualPayments: 300, reconciliationDifference: 0, status: "ok" },
  { agent: "Westcourt Management", platform: "Street", holdingTransfer: 18710, cboTotal: 18010, cboManualPayments: 700, reconciliationDifference: 0, status: "ok" },
];

const softwareGroups: SoftwareGroup[] = [
  { software: "10Ninety", balancingSheetTotal: 18240, paymentFileTotal: 18240, cboTotal: 17650, cboManualPayments: 590 },
  { software: "Jupix", balancingSheetTotal: 21485, paymentFileTotal: 21485, cboTotal: 20735, cboManualPayments: 750 },
  { software: "Alto", balancingSheetTotal: 19860, paymentFileTotal: 19610, cboTotal: 19010, cboManualPayments: 850 },
  { software: "Street", balancingSheetTotal: 23620, paymentFileTotal: 23620, cboTotal: 22940, cboManualPayments: 680 },
  { software: "Acquaint", balancingSheetTotal: 17275, paymentFileTotal: 17275, cboTotal: 16625, cboManualPayments: 650 },
  { software: "Genie", balancingSheetTotal: 15430, paymentFileTotal: 15430, cboTotal: 14910, cboManualPayments: 520 },
  { software: "Veco", balancingSheetTotal: 14380, paymentFileTotal: 14380, cboTotal: 13920, cboManualPayments: 460 },
  { software: "SME", balancingSheetTotal: 16790, paymentFileTotal: 17040, cboTotal: 16140, cboManualPayments: 650 },
  { software: "Reapit", balancingSheetTotal: 24810, paymentFileTotal: 24810, cboTotal: 23990, cboManualPayments: 820 },
];

const holdingTransferAgents: HoldingTransferAgent[] = [
  { agent: "Bridgewater Client Funds", holdingTransfer: 18420, platform: "Alto" },
  { agent: "Evergreen Deposits", holdingTransfer: 22675, platform: "Street" },
  { agent: "Lansdowne Holdings", holdingTransfer: 17340, platform: "Jupix" },
  { agent: "Pioneer Trust Accounts", holdingTransfer: 20980, platform: "Reapit" },
  { agent: "Summit Escrow Services", holdingTransfer: 19465, platform: "10Ninety" },
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

const sortedAgents = [...thirdPartyAgents].sort(
  (a, b) => statusOrder[a.status] - statusOrder[b.status] || a.agent.localeCompare(b.agent),
);

const toneClasses = {
  success: {
    banner: "border-status-success/20 bg-status-success-surface text-status-success-foreground",
    pill: "border-status-success/20 bg-status-success-surface text-status-success-foreground",
    dot: "bg-status-success",
    value: "text-status-success",
  },
  warning: {
    banner: "border-status-warning/20 bg-status-warning-surface text-status-warning-foreground",
    pill: "border-status-warning/20 bg-status-warning-surface text-status-warning-foreground",
    dot: "bg-status-warning",
    value: "text-status-warning",
  },
  danger: {
    banner: "border-status-danger/20 bg-status-danger-surface text-status-danger-foreground",
    pill: "border-status-danger/20 bg-status-danger-surface text-status-danger-foreground",
    dot: "bg-status-danger",
    value: "text-status-danger",
  },
};

const statusMeta: Record<AgentStatus, { label: string; tone: keyof typeof toneClasses }> = {
  issue: { label: "🔴 Issue", tone: "danger" },
  warning: { label: "🟠 Warning", tone: "warning" },
  ok: { label: "🟢 OK", tone: "success" },
};

const SummaryMetric = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-2 rounded-md border border-border bg-panel-alt p-6">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-4xl font-semibold text-foreground">{formatCurrency(value)}</p>
  </div>
);

const TlpPaymentsDashboard = () => {
  const allPlatforms = softwareGroups.map((group) => group.software);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(allPlatforms);
  const [completedHoldingTransfers, setCompletedHoldingTransfers] = useState<Set<string>>(new Set());
  const [completedThirdPartyAgents, setCompletedThirdPartyAgents] = useState<Set<string>>(new Set());
  const [holdingCompletedOpen, setHoldingCompletedOpen] = useState(false);
  const [thirdPartyCompletedOpen, setThirdPartyCompletedOpen] = useState(false);

  const sortedFlags = useMemo(
    () =>
      [...issueFlags]
        .filter((flag) => selectedPlatforms.some((platform) => platform.toUpperCase() === flag.platform.toUpperCase()))
        .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.agent.localeCompare(b.agent)),
    [selectedPlatforms],
  );

  const hasIssues = sortedFlags.length > 0;

  const issueCounts = useMemo(
    () => ({
      issues: sortedFlags.length,
      agents: new Set(sortedFlags.map((flag) => flag.agent)).size,
    }),
    [sortedFlags],
  );

  const overallStatus = useMemo(
    () =>
      sortedFlags.some((flag) => flag.severity === "danger")
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
            },
    [issueCounts.agents, issueCounts.issues, sortedFlags],
  );

  const selectedGroups = useMemo(() => {
    const filtered = softwareGroups.filter((group) => selectedPlatforms.includes(group.software));

    return [...filtered].sort((a, b) => {
      const aMismatch = a.balancingSheetTotal !== a.paymentFileTotal ? 0 : 1;
      const bMismatch = b.balancingSheetTotal !== b.paymentFileTotal ? 0 : 1;

      return aMismatch - bMismatch || a.software.localeCompare(b.software);
    });
  }, [selectedPlatforms]);

  const softwareSummary = selectedGroups.reduce(
    (totals, group) => ({
      cboTotal: totals.cboTotal + group.cboTotal,
      cboManualPayments: totals.cboManualPayments + group.cboManualPayments,
    }),
    { cboTotal: 0, cboManualPayments: 0 },
  );

  const activeHoldingTransfers = useMemo(
    () =>
      holdingTransferAgents.filter(
        (agent) => !completedHoldingTransfers.has(agent.agent) && selectedPlatforms.includes(agent.platform),
      ),
    [completedHoldingTransfers, selectedPlatforms],
  );

  const completedHoldingTransferList = useMemo(
    () =>
      holdingTransferAgents.filter(
        (agent) => completedHoldingTransfers.has(agent.agent) && selectedPlatforms.includes(agent.platform),
      ),
    [completedHoldingTransfers, selectedPlatforms],
  );

  const activeThirdPartyAgents = useMemo(
    () =>
      sortedAgents.filter(
        (agent) => !completedThirdPartyAgents.has(agent.agent) && selectedPlatforms.includes(agent.platform),
      ),
    [completedThirdPartyAgents, selectedPlatforms],
  );

  const completedThirdPartyAgentList = useMemo(
    () =>
      sortedAgents.filter(
        (agent) => completedThirdPartyAgents.has(agent.agent) && selectedPlatforms.includes(agent.platform),
      ),
    [completedThirdPartyAgents, selectedPlatforms],
  );

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((current) => {
      if (current.includes(platform)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== platform);
      }

      return [...current, platform].sort(
        (a, b) =>
          softwareGroups.findIndex((group) => group.software === a) -
          softwareGroups.findIndex((group) => group.software === b),
      );
    });
  };

  const selectAllPlatforms = () => setSelectedPlatforms(allPlatforms);

  const clearPlatforms = () => setSelectedPlatforms(allPlatforms);

  const markHoldingTransferDone = (agentName: string) => {
    setCompletedHoldingTransfers((prev) => new Set([...prev, agentName]));
  };

  const markThirdPartyAgentDone = (agentName: string) => {
    setCompletedThirdPartyAgents((current) => new Set(current).add(agentName));
  };

  return (
    <main className="min-h-screen bg-app">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="issues" className="space-y-6 pb-4">
          <div className="sticky top-0 z-20 space-y-4 bg-app pb-2">
            <header className="rounded-lg border border-border bg-header text-header-foreground shadow-sm">
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
                  <span
                    className={`h-3.5 w-3.5 rounded-full ${toneClasses[overallStatus.tone].dot} ${overallStatus.tone !== "success" ? "motion-safe:animate-soft-pulse" : ""}`}
                  />
                  <div>
                    <p className="text-lg font-semibold">{overallStatus.label}</p>
                    <p className="text-sm opacity-90">{overallStatus.summary}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-panel px-4 py-3 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Platforms:</span>
                  <div className="flex flex-wrap gap-2">
                    {softwareGroups.map((group) => {
                      const selected = selectedPlatforms.includes(group.software);

                      return (
                        <Toggle
                          key={group.software}
                          pressed={selected}
                          onPressedChange={() => togglePlatform(group.software)}
                          variant={selected ? "default" : "outline"}
                          className={selected ? undefined : "text-muted-foreground"}
                        >
                          {group.software}
                        </Toggle>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end lg:self-auto">
                  <button type="button" onClick={selectAllPlatforms} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Select all
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button type="button" onClick={clearPlatforms} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Clear
                  </button>
                </div>
              </div>
            </section>

            <TabsList className="h-auto w-full justify-start gap-2 rounded-lg border border-border bg-panel p-2">
            <TabsTrigger value="issues" className="gap-2 rounded-md px-4 py-2">
              <span>Issues</span>
              {hasIssues && (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-status-danger/20 bg-status-danger-surface px-2 py-0.5 text-xs font-semibold text-status-danger-foreground">
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
          </div>

          <TabsContent value="issues" className="mt-0">
            <section aria-labelledby="issues-heading" className="space-y-4">
              <div className="space-y-1">
                <h2 id="issues-heading" className="text-xl font-semibold text-foreground">
                  Issues Requiring Attention
                </h2>
                <p className="text-sm text-muted-foreground">
                  Items are prioritised by severity to support payment run review.
                </p>
              </div>

              {hasIssues ? (
                <ul className="divide-y divide-border border-y border-border bg-panel">
                  {sortedFlags.map((flag) => {
                    const tone = toneClasses[flag.severity];

                    return (
                      <li
                        key={`${flag.agent}-${flag.type}`}
                        className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(340px,1.2fr)_minmax(280px,1fr)] lg:items-center lg:px-5"
                      >
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                          <span className="font-semibold text-foreground">{flag.agent}</span>
                          <span className="inline-flex items-center rounded-full border border-border bg-panel-alt px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            {flag.platform}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone.pill}`}>
                            {flag.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground lg:text-right">{flag.detail}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="border-y border-border bg-panel px-4 py-6 text-sm text-muted-foreground">
                  No issues currently require attention.
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="tlp-account-payments" className="mt-0">
            <section aria-labelledby="tlp-account-payments-heading" className="space-y-6">
              <div className="space-y-1">
                <h2 id="tlp-account-payments-heading" className="text-xl font-semibold text-foreground">
                  TLP Account Payments
                </h2>
                <p className="text-sm text-muted-foreground">
                  Combined totals and file-to-sheet comparisons across selected software groups.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SummaryMetric label="Total (£)" value={softwareSummary.cboTotal} />
                <SummaryMetric label="Manual Payments (£)" value={softwareSummary.cboManualPayments} />
              </div>

              <div className="border-t border-border pt-6">
                <div className="mb-4 grid grid-cols-[minmax(180px,1.2fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)] gap-4 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <span>Software</span>
                  <span>Balancing Sheet Total</span>
                  <span>Payment File Total</span>
                  <span>Result</span>
                </div>

                <div className="divide-y divide-border border-y border-border bg-panel">
                  {selectedGroups.map((group) => {
                    const difference = group.paymentFileTotal - group.balancingSheetTotal;
                    const matches = difference === 0;

                    return (
                      <div
                        key={group.software}
                        className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(180px,1.2fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)] lg:items-center"
                      >
                        <span className="font-semibold text-foreground">{group.software}</span>
                        <span className="text-sm text-foreground">
                          <span className="mr-2 text-muted-foreground">Balancing Sheet:</span>
                          <span className="tabular-nums">{formatCurrency(group.balancingSheetTotal)}</span>
                        </span>
                        <span className="text-sm text-foreground">
                          <span className="mr-2 text-muted-foreground">Payment File:</span>
                          <span className="tabular-nums">{formatCurrency(group.paymentFileTotal)}</span>
                        </span>
                        <span className={`text-sm font-semibold ${matches ? "text-status-success" : "text-status-danger"}`}>
                          {matches ? `✅ Match` : `❌ Difference: ${formatCurrency(difference)}`}
                        </span>
                      </div>
                    );
                  })}

                  {selectedGroups.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                      No software groups selected.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="manual-bank-payments" className="mt-0">
            <section aria-labelledby="manual-bank-payments-heading" className="space-y-8">
              <div className="space-y-1">
                <h2 id="manual-bank-payments-heading" className="text-xl font-semibold text-foreground">
                  Manual Bank Payments
                </h2>
                <p className="text-sm text-muted-foreground">
                  Operational transfers and third party agent payment activity for today&apos;s run.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Holding Account Transfers</h3>
                  <p className="text-sm text-muted-foreground">Separate holding transfer agents for manual bank payment oversight.</p>
                </div>

                <div className="divide-y divide-border border-y border-border bg-panel">
                  {activeHoldingTransfers.map((agent) => (
                    <div key={agent.agent} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="truncate font-semibold text-foreground">{agent.agent}</span>
                        <span className="inline-flex items-center rounded-full border border-border bg-panel-alt px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          {agent.platform}
                        </span>
                      </div>
                      <span className="tabular-nums text-sm font-semibold text-foreground">
                        {formatCurrency(agent.holdingTransfer)}
                      </span>
                      <Button
                        type="button"
                        onClick={() => markHoldingTransferDone(agent.agent)}
                        className="min-w-32"
                      >
                        <Check />
                        Mark as Done
                      </Button>
                    </div>
                  ))}

                  {activeHoldingTransfers.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground">No active holding account transfers remaining.</div>
                  )}
                </div>

                <Collapsible open={holdingCompletedOpen} onOpenChange={setHoldingCompletedOpen} className="rounded-lg border border-border bg-panel">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">Completed ({completedHoldingTransferList.length})</span>
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-border bg-panel-alt px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {completedHoldingTransferList.length}
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${holdingCompletedOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-border">
                    {completedHoldingTransferList.length > 0 ? (
                      <div className="divide-y divide-border">
                        {completedHoldingTransferList.map((agent) => (
                          <div key={agent.agent} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-4 text-muted-foreground">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="truncate font-semibold text-muted-foreground">{agent.agent}</span>
                              <span className="inline-flex items-center rounded-full border border-border bg-panel-alt px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                {agent.platform}
                              </span>
                            </div>
                            <span className="tabular-nums text-sm font-semibold">{formatCurrency(agent.holdingTransfer)}</span>
                            <Button
                              type="button"
                              disabled
                              className="min-w-32 border border-status-success/20 bg-status-success-surface text-status-success-foreground hover:bg-status-success-surface"
                            >
                              <Check />
                              Done
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-sm text-muted-foreground">No completed holding account transfers yet.</div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Third Party Agents</h3>
                  <p className="text-sm text-muted-foreground">Issue and warning rows are surfaced first for rapid review.</p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <div className="min-w-[1080px]">
                    <div className="grid grid-cols-[130px_minmax(260px,1.7fr)_minmax(140px,1fr)_minmax(160px,1fr)_160px] border-b border-border bg-panel px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <span>Status</span>
                      <span>Agent</span>
                      <span>Total</span>
                      <span>Manual Payments</span>
                      <span className="text-right">Action</span>
                    </div>

                    {activeThirdPartyAgents.map((agent, index) => {
                      const meta = statusMeta[agent.status];
                      const tone = toneClasses[meta.tone];

                      return (
                        <div
                          key={agent.agent}
                          className={`grid grid-cols-[130px_minmax(260px,1.7fr)_minmax(140px,1fr)_minmax(160px,1fr)_160px] items-center border-b border-border px-4 py-4 text-sm ${index % 2 === 0 ? "bg-panel" : "bg-panel-alt/60"}`}
                        >
                          <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone.pill}`}>
                            {meta.label}
                          </span>
                          <div className="space-y-1">
                            <span className="block font-semibold text-foreground">{agent.agent}</span>
                            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              {agent.platform}
                            </span>
                          </div>
                          <span className="tabular-nums text-foreground">{formatCurrency(agent.cboTotal)}</span>
                          <span className="tabular-nums text-foreground">{formatCurrency(agent.cboManualPayments)}</span>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => markThirdPartyAgentDone(agent.agent)}
                              className="min-w-32"
                            >
                              <Check />
                              Mark as Done
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {activeThirdPartyAgents.length === 0 && (
                      <div className="px-4 py-6 text-sm text-muted-foreground">No active third party agents remaining.</div>
                    )}
                  </div>
                </div>

                <Collapsible open={thirdPartyCompletedOpen} onOpenChange={setThirdPartyCompletedOpen} className="rounded-lg border border-border bg-panel">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">Completed ({completedThirdPartyAgentList.length})</span>
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-border bg-panel-alt px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {completedThirdPartyAgentList.length}
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${thirdPartyCompletedOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-border">
                    {completedThirdPartyAgentList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <div className="min-w-[1080px] divide-y divide-border">
                          {completedThirdPartyAgentList.map((agent) => {
                            const meta = statusMeta[agent.status];
                            const tone = toneClasses[meta.tone];

                            return (
                              <div
                                key={agent.agent}
                                className="grid grid-cols-[130px_minmax(260px,1.7fr)_minmax(140px,1fr)_minmax(160px,1fr)_160px] items-center px-4 py-4 text-sm text-muted-foreground"
                              >
                                <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold opacity-70 ${tone.pill}`}>
                                  {meta.label}
                                </span>
                                <div className="space-y-1">
                                  <span className="block font-semibold text-muted-foreground">{agent.agent}</span>
                                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                    {agent.platform}
                                  </span>
                                </div>
                                <span className="tabular-nums">{formatCurrency(agent.cboTotal)}</span>
                                <span className="tabular-nums">{formatCurrency(agent.cboManualPayments)}</span>
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    disabled
                                    className="min-w-32 border border-status-success/20 bg-status-success-surface text-status-success-foreground hover:bg-status-success-surface"
                                  >
                                    <Check />
                                    Done
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-sm text-muted-foreground">No completed third party agents yet.</div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default TlpPaymentsDashboard;