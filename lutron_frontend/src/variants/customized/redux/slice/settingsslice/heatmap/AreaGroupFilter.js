import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// ✅ SAME FOLDER → use ./
import {
    fetchAreaGroups,
    selectAreaGroups
  } from "./groupOccupancySlice";
  
  // ✅ GO UP TO redux → slice → dashboard
  import {
    setSelectedGroupIds
  } from "../../dashboard/dashboardSlice";
// import {
//   fetchAreaGroups,
//   selectAreaGroups
// } from "../../redux/slice/settingsslice/heatmap/groupOccupancySlice";

// import {
//   setSelectedGroupIds
// } from "../../redux/slice/dashboard/dashboardSlice";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText
} from "@mui/material";

const AreaGroupFilter = () => {
  const dispatch = useDispatch();
  const areaGroups = useSelector(selectAreaGroups);

  const [selectedGroups, setSelectedGroups] = useState([]);

  // 🔹 Fetch groups
  useEffect(() => {
    dispatch(fetchAreaGroups());
  }, [dispatch]);

  // 🔹 Handle change
  const handleChange = (event) => {
    const value = event.target.value;
    setSelectedGroups(value);

    // ✅ THIS CONNECTS TO DASHBOARD APIs
    dispatch(setSelectedGroupIds(value));
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel>Area Groups</InputLabel>

      <Select
        multiple
        value={selectedGroups}
        onChange={handleChange}
        renderValue={(selected) =>
          selected
            .map(id => {
              const g = areaGroups.user_area_groups?.find(x => x.id === id);
              return g?.name;
            })
            .join(", ")
        }
      >
        {areaGroups.user_area_groups?.map((group) => (
          <MenuItem key={group.id} value={group.id}>
            <Checkbox checked={selectedGroups.includes(group.id)} />
            <ListItemText primary={group.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default AreaGroupFilter;