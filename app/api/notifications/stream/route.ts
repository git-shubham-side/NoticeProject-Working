import { getCurrentUser } from '@/lib/auth';
import { subscribeToUserNotifications } from '@/lib/realtime';

const encoder = new TextEncoder();

function formatSse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let unsubscribe = () => {};
  let keepAlive: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(formatSse('connected', { ok: true }));

      unsubscribe = subscribeToUserNotifications(user.id, event => {
        controller.enqueue(formatSse(event.type, event));
      });

      keepAlive = setInterval(() => {
        controller.enqueue(formatSse('ping', { at: new Date().toISOString() }));
      }, 25000);
    },
    cancel() {
      if (keepAlive) {
        clearInterval(keepAlive);
      }
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
