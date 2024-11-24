export const CALL_HISTORY_QUERY = `
query GetCallHistory($first: Int!, $after: String, $orderBy: Any, $filter: Any) {
  call_historyCollection(
    first: $first, 
    after: $after, 
    orderBy: $orderBy,
    filter: $filter
  ) {
    edges {
      node {
        id
        transcript
        to_number
        from_number
        prompt
        start_time
        end_time
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;


