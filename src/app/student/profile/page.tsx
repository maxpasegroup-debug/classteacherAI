import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { StudentProfessionalProfile } from "@/components/student-professional-profile";
import { computeAttemptStats } from "@/lib/student-profile-snapshot";

export default async function StudentProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  await applyPlanExpiry(session.userId);

  const userId = session.userId;

  const [user, vision, attempts, nexaMem, studentProfile, latestPeerRank] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        plan: true,
        credits: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
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
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { exam: true, targetRank: true },
    }),
    prisma.studentPerformance.findFirst({
      where: { studentId: userId, rank: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { rank: true, percentile: true },
    }),
  ]);

  if (!user) redirect("/auth/login");

  const paidActive =
    user.subscriptionStatus === "ACTIVE" &&
    Boolean(user.subscriptionExpiry && user.subscriptionExpiry > new Date());

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
        subscriptionExpiry: user.subscriptionExpiry,
        credits: user.credits,
        createdAt: user.createdAt,
      }}
      vision={vision}
      onboardingExam={studentProfile?.exam ?? null}
      onboardingTargetRank={studentProfile?.targetRank ?? null}
      peerRankSnapshot={
        latestPeerRank?.rank != null
          ? { rank: latestPeerRank.rank, percentile: latestPeerRank.percentile }
          : null
      }
      stats={stats}
      paidActive={paidActive}
    />
  );
}
