"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Donation, Drive, DonationStatus } from "@/lib/drive-types";
import { DRIVE_CURRENCY } from "@/lib/drive-config";

const STATUS_COLOR: Record<DonationStatus, string> = {
  verified: "#057A55",
  pending: "#9A6A0F",
  rejected: "#B23B32",
};

const STATUS_LABEL: Record<DonationStatus, string> = {
  verified: "Verified",
  pending: "Pending",
  rejected: "Rejected",
};

const GENERAL_FUND_KEY = "__general__";

function fmtAmount(n: number): string {
  return `${DRIVE_CURRENCY} ${Math.round(n).toLocaleString()}`;
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function toMonthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function FinancialReport({
  donations,
  drives,
}: {
  donations: Donation[];
  drives: Drive[];
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [driveFilter, setDriveFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<DonationStatus | "all">("all");

  const driveNameById = useMemo(() => new Map(drives.map((d) => [d.id, d.name])), [drives]);

  const filtered = useMemo(() => {
    return donations.filter((d) => {
      const day = toDayKey(d.createdAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (driveFilter === "general" && d.driveId !== null) return false;
      if (driveFilter !== "all" && driveFilter !== "general" && d.driveId !== driveFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [donations, from, to, driveFilter, statusFilter]);

  const summary = useMemo(() => {
    let verifiedTotal = 0;
    let pendingTotal = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    for (const d of filtered) {
      if (d.status === "verified") verifiedTotal += d.amount;
      else if (d.status === "pending") {
        pendingTotal += d.amount;
        pendingCount += 1;
      } else if (d.status === "rejected") rejectedCount += 1;
    }
    return { verifiedTotal, pendingTotal, pendingCount, rejectedCount, count: filtered.length };
  }, [filtered]);

  const timeSeries = useMemo(() => {
    const verified = filtered.filter((d) => d.status === "verified");
    if (verified.length === 0) return [];
    // Switch to monthly buckets once the range covers enough distinct days
    // that a daily x-axis would just be unreadable noise.
    const useMonth = new Set(verified.map((d) => toDayKey(d.createdAt))).size > 45;
    const keyFn = useMonth ? toMonthKey : toDayKey;
    const totals = new Map<string, number>();
    for (const d of verified) {
      const key = keyFn(d.createdAt);
      totals.set(key, (totals.get(key) ?? 0) + d.amount);
    }
    return Array.from(totals.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, amount]) => ({ key, amount }));
  }, [filtered]);

  const byDrive = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of filtered) {
      if (d.status !== "verified") continue;
      const key = d.driveId ?? GENERAL_FUND_KEY;
      totals.set(key, (totals.get(key) ?? 0) + d.amount);
    }
    return Array.from(totals.entries())
      .map(([key, amount]) => ({
        key,
        name: key === GENERAL_FUND_KEY ? "General fund" : driveNameById.get(key) ?? "Drive",
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered, driveNameById]);

  const byStatus = useMemo(() => {
    const totals = new Map<DonationStatus, number>();
    for (const d of filtered) {
      totals.set(d.status, (totals.get(d.status) ?? 0) + 1);
    }
    return (Object.keys(STATUS_LABEL) as DonationStatus[])
      .map((status) => ({ status, count: totals.get(status) ?? 0 }))
      .filter((s) => s.count > 0);
  }, [filtered]);

  const hasFilters = Boolean(from || to || driveFilter !== "all" || statusFilter !== "all");

  return (
    <div className="space-y-6">
      <div className="ornate-card p-4 sm:p-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="label-field">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input-field !py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="label-field">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input-field !py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="label-field">Drive</label>
          <select
            value={driveFilter}
            onChange={(e) => setDriveFilter(e.target.value)}
            className="input-field !py-1.5 text-sm"
          >
            <option value="all">All drives</option>
            <option value="general">General fund</option>
            {drives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DonationStatus | "all")}
            className="input-field !py-1.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setDriveFilter("all");
              setStatusFilter("all");
            }}
            className="btn-ghost !py-1.5 !px-3 text-xs"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="ornate-card p-5">
          <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">Verified total</p>
          <p className="heading-serif text-2xl text-emerald-deep mt-1">{fmtAmount(summary.verifiedTotal)}</p>
        </div>
        <div className="ornate-card p-5">
          <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">Pending review</p>
          <p className="heading-serif text-2xl text-amber mt-1">{fmtAmount(summary.pendingTotal)}</p>
          <p className="text-xs text-ink/50 mt-0.5">
            {summary.pendingCount} submission{summary.pendingCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="ornate-card p-5">
          <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">Rejected</p>
          <p className="heading-serif text-2xl text-danger mt-1">{summary.rejectedCount}</p>
          <p className="text-xs text-ink/50 mt-0.5">of {summary.count} in range</p>
        </div>
      </div>

      <div className="ornate-card p-5">
        <p className="text-sm font-medium text-ink/75 mb-4">Verified donations over time</p>
        {timeSeries.length === 0 ? (
          <p className="text-sm text-ink/50 text-center py-10">No verified donations in this range.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="donationArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#057A55" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#057A55" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e0d8" />
                <XAxis dataKey="key" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e5e0d8" }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v: number) => fmtAmount(v)}
                />
                <Tooltip
                  formatter={(v) => fmtAmount(Number(v))}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="amount" stroke="#057A55" strokeWidth={2} fill="url(#donationArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="ornate-card p-5">
          <p className="text-sm font-medium text-ink/75 mb-4">Verified totals by drive</p>
          {byDrive.length === 0 ? (
            <p className="text-sm text-ink/50 text-center py-10">No verified donations in this range.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDrive} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e0d8" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtAmount(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip formatter={(v) => fmtAmount(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="amount" fill="#057A55" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="ornate-card p-5">
          <p className="text-sm font-medium text-ink/75 mb-4">Submissions by status</p>
          {byStatus.length === 0 ? (
            <p className="text-sm text-ink/50 text-center py-10">No donations in this range.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {byStatus.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLOR[s.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [Number(value), STATUS_LABEL[String(name) as DonationStatus] ?? String(name)]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {byStatus.map((s) => (
              <span key={s.status} className="inline-flex items-center gap-1.5 text-xs text-ink/60">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[s.status] }} />
                {STATUS_LABEL[s.status]} ({s.count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
