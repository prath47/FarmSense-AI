import { v4 as uuidv4 } from "uuid";
import { Session, Module, Message, SessionContext } from "../types/session";

class SessionStore {
  private store = new Map<string, Session>();

  create(module: Module): Session {
    const session: Session = {
      sessionId: uuidv4(),
      module,
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.set(session.sessionId, session);
    return session;
  }

  get(sessionId: string): Session | undefined {
    return this.store.get(sessionId);
  }

  appendMessage(sessionId: string, message: Message): Session | null {
    const session = this.store.get(sessionId);
    if (!session) return null;
    session.messages.push(message);
    session.updatedAt = new Date();
    return session;
  }

  updateContext(sessionId: string, context: Partial<SessionContext>): Session | null {
    const session = this.store.get(sessionId);
    if (!session) return null;
    session.context = { ...session.context, ...context };
    session.updatedAt = new Date();
    return session;
  }

  delete(sessionId: string): boolean {
    return this.store.delete(sessionId);
  }
}

export const sessionStore = new SessionStore();
