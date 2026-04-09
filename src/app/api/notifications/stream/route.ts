import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        const latest = await prisma.notification.findMany({
          where: { userId: session.userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(latest)}\n\n`));
      };

      await send();
      const interval = setInterval(() => {
        void send();
      }, 10000);

      const close = () => clearInterval(interval);
      controller.enqueue(encoder.encode("event: connected\ndata: ok\n\n"));
      (stream as unknown as { _cleanup?: () => void })._cleanup = close;
    },
    cancel() {
      // no-op
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
