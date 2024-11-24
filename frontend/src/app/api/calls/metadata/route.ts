import { VocodeClient } from "@vocode/vocode-api";
import { CallHistoryEntry } from "@/types/call-history-entry";

const vocode = new VocodeClient({
  token: process.env.VOCODE_API_KEY!,
});

export async function POST(request: Request) {
  const payload = await request.json();
  const callId = payload["call_id"];

  const callData = await vocode.calls.getCall({ id: callId });
  console.log(callData);

  const entry: CallHistoryEntry = {
    id: callData.id,
    prompt: callData.agent.prompt.content || "",
    transcript: callData.transcript || "",
    to_number: callData.toNumber,
    from_number: callData.fromNumber,
    start_time: callData.startTime,
    end_time: callData.endTime,
  };

  return new Response();
}
