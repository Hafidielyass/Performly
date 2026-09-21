import { QueryClient } from '@tanstack/react-query';

/**
 * Dashboard figures are derived from personnes + evaluations, so every mutation that
 * touches either has to mark them stale - otherwise the home bar chart and Vue
 * Consolidée keep serving the cached numbers from before the change.
 *
 * These are four separate top-level keys ('dashboard-consolide' is not a child of
 * 'dashboard'), so one prefix invalidation cannot cover them all.
 */
export function invalidateDashboards(queryClient: QueryClient) {
  const keys = [['dashboard'], ['dashboard-consolide'], ['dashboard-periodes'], ['dashboard-periodes-reseau']];
  for (const queryKey of keys) queryClient.invalidateQueries({ queryKey });
}
