import { DurableObject } from 'cloudflare:workers'

const MAX_CONNECTIONS = 500
const MAX_PER_CLIENT = 10

/**
 * One instance per thread (idFromName(rootPostId)). Fans out "something changed" notifications
 * to connected sockets using the hibernation API. Holds no canonical data: D1 is the source of truth.
 */
export class ThreadRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    // Keepalive pings are answered without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response('Expected WebSocket', { status: 426 })
    if (this.ctx.getWebSockets().length >= MAX_CONNECTIONS) return new Response('Room full', { status: 503 })
    // Sockets are tagged with the client IP (set by the Worker) so one client cannot fill the room.
    const ip = request.headers.get('x-client-ip') ?? 'unknown'
    if (this.ctx.getWebSockets(ip).length >= MAX_PER_CLIENT) return new Response('Too many connections', { status: 429 })
    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server, [ip])
    return new Response(null, { status: 101, webSocket: client })
  }

  /** RPC: send a JSON notification to every connected client. Returns the number of recipients. */
  broadcast(message: string): number {
    let sent = 0
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(message); sent++ } catch { /* socket already closing */ }
    }
    return sent
  }

  async webSocketMessage() {
    // Clients only send pings (auto-answered); anything else is ignored.
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    try { ws.close(code, reason) } catch { /* already closed */ }
  }

  async webSocketError(ws: WebSocket) {
    try { ws.close(1011, 'error') } catch { /* already closed */ }
  }
}
