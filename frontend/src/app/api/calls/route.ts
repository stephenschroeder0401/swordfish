import { EventType, HttpMethod } from "@vocode/vocode-api/api";
import { VocodeClient } from "@vocode/vocode-api";

const vocode = new VocodeClient({
  token: process.env.VOCODE_API_KEY!,
});

const AZURE_VOICE_CONFIG = {
  type: "voice_azure",
  voiceName: "en-US-AriaNeural",
};

const PLAY_HT_VOICE_CONFIG = {
  type: "voice_play_ht",
  version: "2",
  voiceId: "s3://peregrine-voices/barry ads parrot saad/manifest.json",
};

export async function POST(request: Request) {
  const { prompt, toNumber, voice } = await request.json();

  let voiceConfig: any = PLAY_HT_VOICE_CONFIG;

  if (voice === "2") {
    voiceConfig = AZURE_VOICE_CONFIG;
  }

  await vocode.calls.createCall({
    agent: {
      prompt: {
        content: prompt,
      },
      voice: voiceConfig,
      webhook: {
        subscriptions: [EventType.EventTranscript],
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calls/metadata`,
        method: HttpMethod.Post,
      },
    },
    fromNumber: process.env.FROM_NUMBER!,
    toNumber,
  });

  return new Response();
}
