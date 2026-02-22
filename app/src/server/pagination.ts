import { db } from "@/db/client";
import { and, gt, lt, asc, desc, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export type PaginationOptions = {
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
};

export type PaginatedResult<T> = {
  data: T[];
  next_cursor: string | null;
  total: number;
};

/**
 * Applies cursor-based pagination to a Drizzle query.
 * Cursor is the last ID from the previous page.
 * Default limit 50, max 200.
 * Returns { data, next_cursor, total }.
 *
 * @example
 * const result = await paginate({
 *   table: payments,
 *   idColumn: payments.id,
 *   where: eq(payments.teamId, teamId),
 *   cursor: query.cursor,
 *   limit: query.limit,
 * });
 */
export async function paginate<T>(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  idColumn: any;
  where?: SQL;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderByColumn?: any;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<PaginatedResult<T>> {
  const {
    table,
    idColumn,
    where,
    orderByColumn = idColumn,
    cursor,
    limit = DEFAULT_LIMIT,
    order = "desc",
  } = params;

  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const fetchLimit = safeLimit + 1;

  const cursorCondition =
    cursor !== undefined
      ? order === "desc"
        ? lt(idColumn, cursor)
        : gt(idColumn, cursor)
      : undefined;

  const conditions =
    where && cursorCondition
      ? and(where, cursorCondition)
      : cursorCondition ?? where;

  const orderFn = order === "desc" ? desc : asc;

  const rows = await db.select().from(table).where(conditions).orderBy(orderFn(orderByColumn)).limit(fetchLimit);

  const hasMore = rows.length > safeLimit;
  const data = (hasMore ? rows.slice(0, safeLimit) : rows) as T[];
  const lastRow = data[data.length - 1];
  const next_cursor =
    hasMore && lastRow && typeof lastRow === "object" && "id" in lastRow
      ? (lastRow.id as string)
      : null;

  const [totalResult] = await db.select({ count: count() }).from(table).where(where);

  const total = (totalResult as { count: number } | undefined)?.count ?? 0;

  return {
    data,
    next_cursor,
    total: Number(total),
  };
}
