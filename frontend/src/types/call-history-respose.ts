export interface CallHistoryResponse {
  call_historyCollection: CallHistoryCollection;
}

interface CallHistoryCollection {
  edges: Edge[];
}

export interface Edge {
  node: CallNode;
}

interface CallNode {
  id: string;
  transcript: string;
  to_number: string;
  from_number: string;
  prompt: string;
  start_time: string;
  end_time: string;
}
