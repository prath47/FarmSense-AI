export type Module = "crop_doctor" | "irrigation" | "soil_health";

export interface Message {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  timestamp: Date;
}

export interface SessionContext {
  cropType?: string;
  location?: string;
  soilType?: string;
}

export interface Session {
  sessionId: string;
  module: Module;
  messages: Message[];
  context: SessionContext;
  createdAt: Date;
  updatedAt: Date;
}
