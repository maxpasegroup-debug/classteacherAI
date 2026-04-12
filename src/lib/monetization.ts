/**
 * Plan enforcement and upgrade responses — re-exports the rule engine for a single import path.
 */
export {
  accessDeniedResponse,
  BASIC_EXAMS_PER_UTC_WEEK,
  BASIC_NEXA_MESSAGES_PER_DAY,
  checkUserAccess,
  countExamStartsThisUtcWeek,
  countNexaMessagesToday,
  hasActivePaidPeriod,
  PRO_EXAMS_PER_UTC_WEEK,
  PRO_NEXA_MESSAGES_PER_DAY,
  type PlanFeature,
  type PlanUsageSnapshot,
  type PlanUserSnapshot,
  utcDayStart,
  utcWeekStart,
} from "@/lib/plan-access";
