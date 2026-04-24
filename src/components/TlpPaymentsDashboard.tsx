import { useEffect, useMemo, useState } from "react";
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
  { software: "10Ninety", balancingSheetTotal: 18240, paymentFileTotal: 18240, cboTotal: 17650, cboManualPayments: 590, hasPaymentFile: true },
  { software: "Jupix", balancingSheetTotal: 21485, paymentFileTotal: 21485, cboTotal: 20735, cboManualPayments: 750, hasPaymentFile: true },
  { software: "Alto", balancingSheetTotal: 19860, paymentFileTotal: 19610, cboTotal: 19010, cboManualPayments: 850, hasPaymentFile: true },
  { software: "Street", balancingSheetTotal: 23620, paymentFileTotal: 23620, cboTotal: 22940, cboManualPayments: 680, hasPaymentFile: true },
  { software: "Acquaint", balancingSheetTotal: 17275, paymentFileTotal: 0, cboTotal: 16625, cboManualPayments: 650, hasPaymentFile: false },
  { software: "Genie", balancingSheetTotal: 15430, paymentFileTotal: 15430, cboTotal: 14910, cboManualPayments: 520, hasPaymentFile: true },
  { software: "Veco", balancingSheetTotal: 14380, paymentFileTotal: 14380, cboTotal: 13920, cboManualPayments: 460, hasPaymentFile: true },
  { software: "SME", balancingSheetTotal: 16790, paymentFileTotal: 17040, cboTotal: 16140, cboManualPayments: 650, hasPaymentFile: true },
  { software: "Reapit", balancingSheetTotal: 0, paymentFileTotal: 0, cboTotal: 0, cboManualPayments: 0, hasPaymentFile: false },
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const activePlatforms = selectedPlatforms.length === 0 ? allPlatforms : selectedPlatforms;
  const [completedHoldingTransfers, setCompletedHoldingTransfers] = useState<Set<string>>(new Set());
  const [completedThirdPartyAgents, setCompletedThirdPartyAgents] = useState<Set<string>>(new Set());
  const [firstApprovedGroups, setFirstApprovedGroups] = useState<Set<string>>(new Set());
  const [secondApprovedGroups, setSecondApprovedGroups] = useState<Set<string>>(new Set());
  const [holdingCompletedOpen, setHoldingCompletedOpen] = useState(false);
  const [thirdPartyCompletedOpen, setThirdPartyCompletedOpen] = useState(false);
  const [cutoffDismissed, setCutoffDismissed] = useState(false);
  const [batchOverviewOpen, setBatchOverviewOpen] = useState(false);
  const [holdingOverviewOpen, setHoldingOverviewOpen] = useState(false);
  const [thirdPartyOverviewOpen, setThirdPartyOverviewOpen] = useState(false);
  const [lastRefreshLabel, setLastRefreshLabel] = useState(() =>
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
  );

  const markFirstApproved = (software: string) => {
    setFirstApprovedGroups((prev) => {
      const next = new Set(prev);
      next.add(software);
      return next;
    });
  };

  const markSecondApproved = (software: string) => {
    setSecondApprovedGroups((prev) => {
      const next = new Set(prev);
      next.add(software);
      return next;
    });
  };

  const handleRefresh = () => {
    setCutoffDismissed(false);
    setLastRefreshLabel(
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
    );
  };

  const sortedFlags = useMemo(
    () =>
      [...issueFlags]
        .filter((flag) => activePlatforms.some((platform) => platform.toUpperCase() === flag.platform.toUpperCase()))
        .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.agent.localeCompare(b.agent)),
    [activePlatforms],
  );

  const hasIssues = sortedFlags.length > 0;

  const issueCounts = useMemo(
    () => ({
      issues: sortedFlags.length,
      agents: new Set(sortedFlags.map((flag) => flag.agent)).size,
    }),
    [sortedFlags],
  );

  // overallStatus is defined after totalOutstanding below.


  const selectedGroups = useMemo(() => {
    const filtered = softwareGroups.filter((group) => activePlatforms.includes(group.software));

    return [...filtered].sort((a, b) => {
      const aApproved = secondApprovedGroups.has(a.software) ? 2 : firstApprovedGroups.has(a.software) ? 1 : 0;
      const bApproved = secondApprovedGroups.has(b.software) ? 2 : firstApprovedGroups.has(b.software) ? 1 : 0;
      if (aApproved !== bApproved) return aApproved - bApproved;
      const aMismatch = a.balancingSheetTotal !== a.paymentFileTotal ? 0 : 1;
      const bMismatch = b.balancingSheetTotal !== b.paymentFileTotal ? 0 : 1;
      return aMismatch - bMismatch || a.software.localeCompare(b.software);
    });
  }, [activePlatforms, firstApprovedGroups, secondApprovedGroups]);

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
        (agent) => !completedHoldingTransfers.has(agent.agent) && activePlatforms.includes(agent.platform),
      ),
    [completedHoldingTransfers, activePlatforms],
  );

  const completedHoldingTransferList = useMemo(
    () =>
      holdingTransferAgents.filter(
        (agent) => completedHoldingTransfers.has(agent.agent) && activePlatforms.includes(agent.platform),
      ),
    [completedHoldingTransfers, activePlatforms],
  );

  const activeThirdPartyAgents = useMemo(
    () =>
      sortedAgents.filter(
        (agent) => !completedThirdPartyAgents.has(agent.agent) && activePlatforms.includes(agent.platform),
      ),
    [completedThirdPartyAgents, activePlatforms],
  );

  const completedThirdPartyAgentList = useMemo(
    () =>
      sortedAgents.filter(
        (agent) => completedThirdPartyAgents.has(agent.agent) && activePlatforms.includes(agent.platform),
      ),
    [completedThirdPartyAgents, activePlatforms],
  );

  const outstandingBatch = useMemo(
    () =>
      softwareGroups.filter(
        (g) =>
          activePlatforms.includes(g.software) &&
          !completedBatchGroups.has(g.software) &&
          (g.balancingSheetTotal > 0 || g.hasPaymentFile),
      ),
    [activePlatforms, completedBatchGroups],
  );

  const paidBatch = useMemo(
    () =>
      softwareGroups.filter(
        (g) =>
          activePlatforms.includes(g.software) &&
          completedBatchGroups.has(g.software) &&
          (g.balancingSheetTotal > 0 || g.hasPaymentFile),
      ),
    [activePlatforms, completedBatchGroups],
  );

  const outstandingHolding = activeHoldingTransfers;
  const paidHolding = completedHoldingTransferList;
  const outstandingThirdParty = activeThirdPartyAgents;
  const paidThirdParty = completedThirdPartyAgentList;

  const checkCutoff = () => {
    const now = new Date();
    return (
      now.getHours() > CUTOFF_HOUR ||
      (now.getHours() === CUTOFF_HOUR && now.getMinutes() >= CUTOFF_MINUTE)
    );
  };

  const [isPastCutoff, setIsPastCutoff] = useState(checkCutoff);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPastCutoff(checkCutoff());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const totalOutstanding =
    outstandingBatch.length + outstandingHolding.length + outstandingThirdParty.length;

  const overallStatus = useMemo(() => {
    const hasDanger = sortedFlags.some((flag) => flag.severity === "danger");
    const hasWarning = sortedFlags.length > 0;
    const hasOutstanding = totalOutstanding > 0;

    if (hasDanger) return {
      tone: "danger" as const,
      label: "Action Required",
      summary: `${issueCounts.issues} issue${issueCounts.issues !== 1 ? "s" : ""} found across ${issueCounts.agents} agent${issueCounts.agents !== 1 ? "s" : ""} — ${totalOutstanding} payment${totalOutstanding !== 1 ? "s" : ""} outstanding`,
    };
    if (hasWarning) return {
      tone: "warning" as const,
      label: "Attention Required",
      summary: `${issueCounts.issues} issue${issueCounts.issues !== 1 ? "s" : ""} to review — ${totalOutstanding} payment${totalOutstanding !== 1 ? "s" : ""} outstanding`,
    };
    if (hasOutstanding) return {
      tone: "warning" as const,
      label: "Payments In Progress",
      summary: `No issues — ${totalOutstanding} payment${totalOutstanding !== 1 ? "s" : ""} still outstanding`,
    };
    return {
      tone: "success" as const,
      label: "All Clear",
      summary: "All payments complete, no issues outstanding",
    };
  }, [sortedFlags, issueCounts, totalOutstanding]);

  const showCutoffAlert = isPastCutoff && totalOutstanding > 0 && !cutoffDismissed;

  const totalItems =
    outstandingBatch.length +
    paidBatch.length +
    outstandingHolding.length +
    paidHolding.length +
    outstandingThirdParty.length +
    paidThirdParty.length;

  const completedItems = paidBatch.length + paidHolding.length + paidThirdParty.length;
  const progressValue = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;


  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((current) => {
      if (current.includes(platform)) {
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

  const clearPlatforms = () => setSelectedPlatforms([]);

  const markHoldingTransferDone = (agentName: string) => {
    setCompletedHoldingTransfers((prev) => {
      const next = new Set(prev);
      next.add(agentName);
      return next;
    });
  };

  const markThirdPartyAgentDone = (agentName: string) => {
    setCompletedThirdPartyAgents((prev) => {
      const next = new Set(prev);
      next.add(agentName);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-app">
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-border">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progressValue}%`,
            backgroundColor: progressValue === 100 ? "var(--status-success)" : "var(--color-primary, #4472C4)",
          }}
        />
      </div>
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-6 pt-1 sm:px-6 lg:px-8">
        <Tabs defaultValue="run-status" className="space-y-6 pb-4">
          <div className="sticky top-0 z-20 space-y-2 bg-app pb-2">
            <header className="rounded-lg border border-border bg-header text-header-foreground shadow-sm">
              <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight">TLP Daily Payments Dashboard</h1>
                  <div className="flex flex-col gap-1 text-sm text-header-foreground/80 sm:flex-row sm:gap-6">
                    <span>Today: {todayLabel}</span>
                    <span>Last refreshed: {lastRefreshLabel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end lg:self-auto">
                  <div className="flex items-center gap-2 text-sm text-header-foreground/80">
                    <button
                      type="button"
                      onClick={selectAllPlatforms}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Select all
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={clearPlatforms}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  <Button variant="toolbar" onClick={handleRefresh} className="min-w-32 bg-panel text-foreground hover:-translate-y-0.5">
                    <RefreshCw className="motion-safe:group-hover:animate-spin-slow" />
                    Refresh
                  </Button>
                </div>
              </div>
            </header>

            <section
              aria-label="Overall run status"
              className={`rounded-lg border px-5 py-4 ${toneClasses[overallStatus.tone].banner}`}
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

            <div className="flex items-center gap-3 py-2">
              <span className="text-sm font-medium text-muted-foreground">Platforms:</span>
              <div className="flex flex-wrap gap-2">
                {softwareGroups.map((group) => {
                  const selected = selectedPlatforms.includes(group.software);

                  return (
                    <Toggle
                      key={group.software}
                      pressed={selected}
                      onPressedChange={() => togglePlatform(group.software)}
                      className={
                        selected
                          ? "h-auto rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-semibold text-background data-[state=on]:bg-foreground data-[state=on]:text-background hover:bg-foreground hover:text-background"
                          : "h-auto rounded-full border border-border bg-transparent px-3 py-1 text-xs text-muted-foreground hover:bg-panel-alt"
                      }
                    >
                      {group.software}
                    </Toggle>
                  );
                })}
              </div>
            </div>

            <TabsList className="flex h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger
                value="run-status"
                className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <span>Run Status</span>
                {hasIssues && (
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-status-danger/20 bg-status-danger-surface px-2 py-0.5 text-xs font-semibold text-status-danger-foreground">
                    {issueCounts.issues}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="tlp-account-payments"
                className="rounded-none border-b-2 border-transparent bg-transparent px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                TLP Account Payments
              </TabsTrigger>
              <TabsTrigger
                value="manual-bank-payments"
                className="rounded-none border-b-2 border-transparent bg-transparent px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Manual Bank Payments
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="run-status" className="mt-0">
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
                <ul className="space-y-2">
                  {sortedFlags.map((flag) => {
                    const tone = toneClasses[flag.severity];
                    const accent =
                      flag.severity === "danger"
                        ? "border-l-status-danger bg-status-danger-surface/40"
                        : "border-l-status-warning bg-status-warning-surface/40";

                    return (
                      <li
                        key={`${flag.agent}-${flag.type}`}
                        className={`rounded-md border border-border border-l-4 px-4 py-3 ${accent}`}
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
                        <p className="mt-2 text-sm text-foreground/80">{flag.detail}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-status-success/20 bg-status-success-surface px-3 py-2 text-sm font-medium text-status-success-foreground">
                  <span>✅ No issues — payment run is clear</span>
                </div>
              )}

              <div className="space-y-4 rounded-lg border border-border bg-panel-alt/40 p-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">Payment Run Overview</h2>
                  <p className="text-sm text-muted-foreground">
                    All agents with a balance or payment file today, grouped by category.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Run progress</span>
                    <span className="tabular-nums">
                      {completedItems} / {totalItems} complete
                    </span>
                  </div>
                  <Progress value={progressValue} />
                </div>

                {/* Batch Payments group */}
                <Collapsible open={batchOverviewOpen} onOpenChange={setBatchOverviewOpen} className="rounded-lg border border-border bg-panel">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        Batch Payments —{" "}
                        <span className={outstandingBatch.length > 0 ? "text-status-danger" : "text-status-success"}>
                          {outstandingBatch.length} outstanding
                        </span>
                        {", "}
                        <span className="text-status-success">{paidBatch.length} paid</span>
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${batchOverviewOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-border">
                    <div className="divide-y divide-border">
                      {outstandingBatch.map((g) => {
                        const noBalancing = g.hasPaymentFile && g.balancingSheetTotal === 0;
                        return (
                          <div key={g.software} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3">
                            <span className="font-semibold text-foreground">{g.software}</span>
                            <span className="tabular-nums text-sm text-foreground">{formatCurrency(g.balancingSheetTotal)}</span>
                            {noBalancing ? (
                              <span className="inline-flex items-center rounded-full border border-status-warning/20 bg-status-warning-surface px-3 py-1 text-xs font-semibold text-status-warning-foreground">
                                No Balancing Sheet
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-status-danger/20 bg-status-danger-surface px-3 py-1 text-xs font-semibold text-status-danger-foreground">
                                Outstanding
                              </span>
                            )}
                            <Button type="button" onClick={() => markBatchGroupDone(g.software)} className="min-w-32">
                              <Check />
                              Mark as Done
                            </Button>
                          </div>
                        );
                      })}
                      {paidBatch.map((g) => (
                        <div key={g.software} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 text-muted-foreground">
                          <span className="font-semibold">{g.software}</span>
                          <span className="tabular-nums text-sm">{formatCurrency(g.balancingSheetTotal)}</span>
                          <span className="inline-flex items-center rounded-full border border-status-success/20 bg-status-success-surface px-3 py-1 text-xs font-semibold text-status-success-foreground">
                            ✅ Paid
                          </span>
                          <span />
                        </div>
                      ))}
                      {outstandingBatch.length === 0 && paidBatch.length === 0 && (
                        <div className="px-4 py-4 text-sm text-muted-foreground">No batch payment groups in scope.</div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Holding group */}
                <Collapsible open={holdingOverviewOpen} onOpenChange={setHoldingOverviewOpen} className="rounded-lg border border-border bg-panel">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
                    <span className="text-sm font-semibold text-foreground">
                      Holding Account Transfers —{" "}
                      <span className={outstandingHolding.length > 0 ? "text-status-danger" : "text-status-success"}>
                        {outstandingHolding.length} outstanding
                      </span>
                      {", "}
                      <span className="text-status-success">{paidHolding.length} paid</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${holdingOverviewOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-border">
                    <div className="divide-y divide-border">
                      {outstandingHolding.map((agent) => (
                        <div key={agent.agent} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3">
                          <span className="font-semibold text-foreground">{agent.agent}</span>
                          <span className="tabular-nums text-sm text-foreground">{formatCurrency(agent.holdingTransfer)}</span>
                          <span className="inline-flex items-center rounded-full border border-status-danger/20 bg-status-danger-surface px-3 py-1 text-xs font-semibold text-status-danger-foreground">
                            Outstanding
                          </span>
                        </div>
                      ))}
                      {paidHolding.map((agent) => (
                        <div key={agent.agent} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-muted-foreground">
                          <span className="font-semibold">{agent.agent}</span>
                          <span className="tabular-nums text-sm">{formatCurrency(agent.holdingTransfer)}</span>
                          <span className="inline-flex items-center rounded-full border border-status-success/20 bg-status-success-surface px-3 py-1 text-xs font-semibold text-status-success-foreground">
                            ✅ Paid
                          </span>
                        </div>
                      ))}
                      {outstandingHolding.length === 0 && paidHolding.length === 0 && (
                        <div className="px-4 py-4 text-sm text-muted-foreground">No holding account transfers in scope.</div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Third Party group */}
                <Collapsible open={thirdPartyOverviewOpen} onOpenChange={setThirdPartyOverviewOpen} className="rounded-lg border border-border bg-panel">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
                    <span className="text-sm font-semibold text-foreground">
                      Third Party Agents —{" "}
                      <span className={outstandingThirdParty.length > 0 ? "text-status-danger" : "text-status-success"}>
                        {outstandingThirdParty.length} outstanding
                      </span>
                      {", "}
                      <span className="text-status-success">{paidThirdParty.length} paid</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${thirdPartyOverviewOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-border">
                    <div className="divide-y divide-border">
                      {outstandingThirdParty.map((agent) => (
                        <div key={agent.agent} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3">
                          <span className="font-semibold text-foreground">{agent.agent}</span>
                          <span className="tabular-nums text-sm text-foreground">{formatCurrency(agent.cboTotal)}</span>
                          <span className="inline-flex items-center rounded-full border border-status-danger/20 bg-status-danger-surface px-3 py-1 text-xs font-semibold text-status-danger-foreground">
                            Outstanding
                          </span>
                        </div>
                      ))}
                      {paidThirdParty.map((agent) => (
                        <div key={agent.agent} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-muted-foreground">
                          <span className="font-semibold">{agent.agent}</span>
                          <span className="tabular-nums text-sm">{formatCurrency(agent.cboTotal)}</span>
                          <span className="inline-flex items-center rounded-full border border-status-success/20 bg-status-success-surface px-3 py-1 text-xs font-semibold text-status-success-foreground">
                            ✅ Paid
                          </span>
                        </div>
                      ))}
                      {outstandingThirdParty.length === 0 && paidThirdParty.length === 0 && (
                        <div className="px-4 py-4 text-sm text-muted-foreground">No third party agents in scope.</div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
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

              <p className="text-sm text-muted-foreground">
                Showing {selectedGroups.length} of {softwareGroups.length} platforms
              </p>

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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Holding Account Transfers</h3>
                    <p className="text-sm text-muted-foreground">Separate holding transfer agents for manual bank payment oversight.</p>
                  </div>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {activeHoldingTransfers.length} remaining
                  </p>
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Third Party Agents</h3>
                    <p className="text-sm text-muted-foreground">Issue and warning rows are surfaced first for rapid review.</p>
                  </div>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {activeThirdPartyAgents.length} remaining
                  </p>
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

      {showCutoffAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-panel p-6 shadow-xl">
            <h2 className="text-lg font-bold text-status-danger">
              ⚠️ Outstanding Payments Past {String(CUTOFF_HOUR).padStart(2, "0")}:{String(CUTOFF_MINUTE).padStart(2, "0")}
            </h2>
            <div className="mt-4 space-y-4">
              {outstandingBatch.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Batch</h3>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {outstandingBatch.map((g) => (
                      <li key={g.software}>{g.software}</li>
                    ))}
                  </ul>
                </div>
              )}
              {outstandingHolding.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Holding Account Transfers</h3>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {outstandingHolding.map((agent) => (
                      <li key={agent.agent}>{agent.agent}</li>
                    ))}
                  </ul>
                </div>
              )}
              {outstandingThirdParty.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Third Party Agents</h3>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {outstandingThirdParty.map((agent) => (
                      <li key={agent.agent}>{agent.agent}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setCutoffDismissed(true)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TlpPaymentsDashboard;