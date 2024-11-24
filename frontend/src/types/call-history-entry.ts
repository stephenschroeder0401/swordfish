import { EventType } from "@vocode/vocode-api/api";

export interface CallHistoryEntry {
  id: string;
  transcript: string;
  prompt: string;
  to_number: string;
  from_number: string;
  start_time?: Date;
  end_time?: Date;
}
