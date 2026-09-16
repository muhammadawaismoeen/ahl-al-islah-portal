/**
 * Position registry accessors.
 * ----------------------------------------------------------------
 * Positions are admin-editable content (see /admin/positions), stored
 * in SiteContent.positions and edited via the Advisor's content
 * editor — no code deploy needed to open, close, or add a role.
 *
 * The application form itself is driven by the question sets in
 * `src/lib/questions.ts` — positions reference question sets by id.
 */

import { getContent } from "./content-store";
import type { Position, Wing, PositionLevel } from "./content-types";

export type { Position, Wing, PositionLevel };

export async function getPositionBySlug(
  slug: string
): Promise<Position | undefined> {
  const content = await getContent();
  return content.positions.find((p) => p.slug === slug);
}

export async function getOpenPositions(): Promise<Position[]> {
  const content = await getContent();
  return content.positions
    .filter((p) => p.open)
    .sort((a, b) => a.priority - b.priority);
}

export async function getAllPositions(): Promise<Position[]> {
  const content = await getContent();
  return [...content.positions].sort((a, b) => a.priority - b.priority);
}
