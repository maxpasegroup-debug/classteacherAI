import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { StudentProfessionalProfile } from "@/components/student-professional-profile";
import { computeAttemptStats } from "@/lib/student-profile-snapshot";

export default async function StudentProfilePage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") redirect("/auth/login");

  await applyPlanExpiry(session.userId);

  const userId = session.userId;

  const [user, vision, attempts, nexaMem] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        roles: true,
        plan: true,
        aiCredits: true,
        subscriptionStatus: true,
        planExpiry: true,
        nexaStudentLevel: true,
        nexaStudentSubject: true,
        createdAt: true,
      },
    }),
    prisma.topRankVisionBoard.findUnique({
      where: { userId },
      select: {
        examTrack: true,
        targetRank: true,
        targetDate: true,
        goalCardLine: true,
        dreamCollege: true,
      },
    }),
    prisma.examAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { submittedAt: true, score: true, maxScore: true },
    }),
    prisma.nexaStudentMemory.findUnique({
      where: { userId },
      select: { rankReadiness: true },
    }),
  ]);

  if (!user?.roles.includes("STUDENT")) redirect("/auth/login");

  const paidActive =
    user.subscriptionStatus === "ACTIVE" && Boolean(user.planExpiry && user.planExpiry > new Date());

  const attemptStats = computeAttemptStats(attempts);
  const stats = {
    totalAttempts: attemptStats.totalAttempts,
    avgAccuracyPct: attemptStats.avgAccuracyPct,
    streakDays: attemptStats.streakDays,
    rankReadiness: nexaMem?.rankReadiness ?? null,
  };

  return (
    <StudentProfessionalProfile
      user={{
        name: user.name,
        email: user.email,
        nexaStudentLevel: user.nexaStudentLevel,
        nexaStudentSubject: user.nexaStudentSubject,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        planExpiry: user.planExpiry,
        aiCredits: user.aiCredits,
        createdAt: user.createdAt,
      }}
      vision={vision}
      stats={stats}
      paidActive={paidActive}
    />
  );
}
