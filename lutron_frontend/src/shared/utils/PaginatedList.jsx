// PaginatedList.jsx
import React, { useState } from "react";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const PaginatedList = ({ items, renderItem, pageSize = 6, style = {} }) => {
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(items.length / pageSize) - 1);

  const handleUp = () => setPage(p => Math.max(0, p - 1));
  const handleDown = () => setPage(p => Math.min(maxPage, p + 1));

  const start = page * pageSize;
  const end = start + pageSize;
  const visibleItems = items.slice(start, end);

  return (
    <div style={{ ...style, position: "relative" }}>
      {page > 0 && (
        <button onClick={handleUp} style={{ position: "absolute", left: "50%", top: -30, zIndex: 1, background: "none", border: "none" }}>
          <ArrowDropUpIcon fontSize="large" />
        </button>
      )}
      <div style={{ maxHeight: pageSize * 48, overflow: "hidden" }}>
        {visibleItems.map(renderItem)}
      </div>
      {page < maxPage && (
        <button onClick={handleDown} style={{ position: "absolute", left: "50%", bottom: -30, zIndex: 1, background: "none", border: "none" }}>
          <ArrowDropDownIcon fontSize="large" />
        </button>
      )}
    </div>
  );
};

export default PaginatedList;
