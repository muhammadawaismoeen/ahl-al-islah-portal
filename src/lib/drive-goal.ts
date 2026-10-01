/**
 * Goal-progress arithmetic for the Drive, shared by the landing page, the
 * leaderboard and the celebration components. Pure — safe to import from
 * client components.
 */
import type { Drive } from "./drive-types";

export interface GoalProgress {
  goal: number;
  raised: number;
  /** True percentage, uncapped — 118 when donations ran past the goal. */
  rawPct: number;
  /** Percentage the bar is drawn at, capped at 100 so it never overflows. */
  barPct: number;
  /** Goal set and reached. A drive with no goal is never "met". */
  goalMet: boolean;
  /** Amount raised beyond the goal; 0 when the goal has not been passed. */
  surplus: number;
}

export function computeGoalProgress(
  drive: Pick<Drive, "goalAmount" | "raisedAmount"> | null | undefined
): GoalProgress {
  const goal = drive?.goalAmount ?? 0;
  const raised = drive?.raisedAmount ?? 0;
  const rawPct = goal > 0 ? Math.round((raised / goal) * 100) : 0;
  return {
    goal,
    raised,
    rawPct,
    barPct: Math.min(100, rawPct),
    goalMet: goal > 0 && raised >= goal,
    surplus: Math.max(0, raised - goal),
  };
}
