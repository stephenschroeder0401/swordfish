import React, { useEffect, useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Button,
  Flex,
  Text,
  Input,
  Select,
  Container,
  Heading,
} from "@chakra-ui/react";
import { fetchCallHistory } from "../src/app/utils/supabase-client";
import { Edge } from "../src/app/types/call-history-respose";
import PaginationControls from "../src/components/table/pagination";
import TableDisplay from "@/components/table/table-display";
import { CALL_HISTORY_QUERY } from "@/app/types/queries";

const DataTable = () => {
  const [data, setData] = useState<Edge[]>([]);
  const [sortCriteria, setSortCriteria] = useState("start_time");
  const [sortDirection, setSortDirection] = useState("AscNullsFirst");
  const [sortObject, setSortObject] = useState<{ [key: string]: any }>({
    start_time: "AscNullsFirst",
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchObject, setSearchObject] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setitemsPerPage] = useState(5);
  const [cursors, setCursors] = useState([""]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const tableConfig = [
    { column: "id", label: "Id", canSort: false },
    { column: "prompt", label: "Prompt", canSort: false },
    { column: "transcript", label: "Transcript", canSort: false },
    { column: "to_number", label: "To Number", canSort: false },
    { column: "from_number", label: "From Number", canSort: false },
    { column: "start_time", label: "Start Time", canSort: true },
    { column: "end_time", label: "End Time", canSort: true }
  ]

  const fetchData = async (after: string | null = null) => {
    const variables = {
      first: itemsPerPage,
      after,
      orderBy: sortObject,
      filter: searchObject,
    };

    const response = await fetchCallHistory(CALL_HISTORY_QUERY, variables);
    if (response.data && !response.errors) {
      const fetchedData = response.data.call_historyCollection;
      setData(fetchedData.edges);
      setHasNextPage(fetchedData.pageInfo.hasNextPage);

      if (fetchedData.pageInfo.hasNextPage) {
        const newCursor = fetchedData.pageInfo.endCursor;
        if (!cursors.includes(newCursor)) {
          setCursors([...cursors, newCursor]);
        }
      }
    } else {
      console.error("GraphQL query errors:", response.errors);
    }
  };

  useEffect(() => {
    const after = currentPage > 0 ? cursors[currentPage] : null;
    fetchData(after);
  }, [currentPage, cursors, sortObject, searchObject, itemsPerPage]);

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSort = (criteria: React.SetStateAction<string>) => {
    console.log("criteria", criteria);
    setSortCriteria(criteria);
    setSortDirection(
      sortDirection === "AscNullsFirst" ? "DescNullsFirst" : "AscNullsFirst",
    );

    const sortObject: { [key: string]: any } = {};
    sortObject[sortCriteria] = sortDirection;

    setSortObject(sortObject);
    setCurrentPage(0);
    setCursors([""]);
  };

  const handleFilter = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setCurrentPage(0);

    if (searchTerm.trim().length === 0) {
      setSearchObject({});
    } else {
      //check if the search term is a guid
      const isGuid = searchTerm.match(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
      );
      if (isGuid) {
        setSearchObject({ id: { eq: searchTerm } });
      } else {
        const searchFilter = { ilike: `%${searchTerm}%` };
        const searchObject = {
          or: [
            { prompt: searchFilter },
            { transcript: searchFilter },
            { to_number: searchFilter },
            { from_number: searchFilter },
          ],
        };
        setSearchObject(searchObject);
      }
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Heading as="h1" size="xl" mb={6}>
        Call History Dashboard
      </Heading>
      <Box
        overflowX="auto"
        border="1px"
        borderColor="gray.200"
        borderRadius="lg"
      >
        <Flex justifyContent="left" my="4">
          <PaginationControls
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setitemsPerPage}
            handleNextPage={handleNextPage}
            handlePrevPage={handlePrevPage}
          />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleFilter(e.target.value)}
            width="auto"
            ml="4"
          />
        </Flex>
        <TableDisplay
         tableConfig ={tableConfig}
          data={data}
          handleSort={handleSort}
          sortField={sortCriteria}
          sortDirection={sortDirection}
        />
      </Box>
    </Container>
  );
};

export default DataTable;
