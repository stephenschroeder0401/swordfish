interface BillbackDisplayProps {
  // ... existing props ...
  openClearDialog: () => void;
}

{tableConfig.map((column) => (
  <Th key={column.column} width={column.width}>
    {column.renderHeader ? (
      column.renderHeader()  // This will now render our clear button in the delete column header
    ) : (
      column.label
    )}
  </Th>
))} 