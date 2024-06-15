// PaginationControls.js
import React from "react";
import { Flex, Button, Text, Select } from "@chakra-ui/react";

const PaginationControls = ({
  currentPage,
  hasNextPage,
  itemsPerPage,
  setItemsPerPage,
  handleNextPage,
  handlePrevPage,
}: {
  currentPage: number;
  hasNextPage: boolean;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  handleNextPage: () => void;
  handlePrevPage: () => void;
}) => (
  <>
    <Button ml={2} onClick={handlePrevPage} isDisabled={currentPage === 0}>
      {"<"}
    </Button>
    <Text
      fontSize="md"
      fontWeight="bold"
      color="black"
      px="3"
      py="1"
      borderRadius="md"
      display="inline-block"
      minWidth="50px"
      textAlign="center"
    >
      Page: {currentPage + 1}
    </Text>
    <Button onClick={handleNextPage} isDisabled={!hasNextPage}>
      {">"}
    </Button>
    <Select
      ml="4"
      width="200px"
      value={itemsPerPage}
      onChange={(e) => setItemsPerPage(Number(e.target.value))}
    >
      <option value="5">5 per page</option>
      <option value="10">10 per page</option>
      <option value="20">20 per page</option>
      <option value="50">50 per page</option>
    </Select>
  </>
);

export default PaginationControls;
