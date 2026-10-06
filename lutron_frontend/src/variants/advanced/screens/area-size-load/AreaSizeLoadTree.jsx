import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Collapse } from "@mui/material";
import { AddBoxOutlined, IndeterminateCheckBoxOutlined } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { fetchAreaLoadData, getAreaSizeLoadData } from "../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import { UseAuth } from '../../customhooks/UseAuth';
import { dispatchFetchAreaSizeLoadOnce } from "../../../../shared/utils/bootstrapFetchGuards";
import {
  areaSizeColNameSx,
  areaSizeColNumericSx,
  areaSizeDataRowSx,
  areaSizeExpandSlotSx,
  areaSizeIconButtonSx,
  areaSizeTableHeaderRowSx,
  areaSizeTablePanelSx,
  areaSizeTableScrollSx,
  areaSizeText,
  areaSizeTotalRowSx,
} from "../../utils/areaSizeLoadStyles";

const AreaSizeLoadTree = () => {
    const dispatch = useDispatch();
    const areaData = useSelector(fetchAreaLoadData);
    const [expanded, setExpanded] = useState(false);
    const [floorExpanded, setFloorExpanded] = useState({});

    const { role: currentUserRole } = UseAuth();
    const userProfile = useSelector((state) => state.user?.profile);

    const getAvailableFloors = () => {
        const floors = areaData?.floors || [];
        if (!Array.isArray(floors) || floors.length === 0) {
            return [];
        }
        const roleLower = (currentUserRole || '').toLowerCase();
        if (roleLower === 'superadmin' || roleLower === 'admin') {
            return floors;
        }
        if (roleLower === 'operator' && userProfile && userProfile.floors) {
            const operatorFloorIds = userProfile.floors.map(f => f.floor_id);
            return floors.filter(floor => operatorFloorIds.includes(floor.floor_id));
        }
        return floors;
    };

    useEffect(() => {
        dispatchFetchAreaSizeLoadOnce(dispatch, getAreaSizeLoadData);
    }, [dispatch]);

    const toggleExpand = () => {
        setExpanded((prev) => !prev);
    };

    const toggleFloorExpand = (id) => {
        setFloorExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderValueCells = (load, sqft, sqm) => (
        <>
            <Typography component="span" sx={areaSizeColNumericSx}>
                {(load || 0).toFixed(2)} W
            </Typography>
            <Typography component="span" sx={areaSizeColNumericSx}>
                {(sqft || 0).toFixed(2)}
            </Typography>
            <Typography component="span" sx={areaSizeColNumericSx}>
                {(sqm || 0).toFixed(2)}
            </Typography>
        </>
    );

    const renderExpandButton = (isOpen, onClick) => (
        <Box sx={areaSizeExpandSlotSx}>
            <IconButton size="small" onClick={onClick} sx={areaSizeIconButtonSx} aria-label={isOpen ? "Collapse" : "Expand"}>
                {isOpen ? (
                    <IndeterminateCheckBoxOutlined fontSize="small" />
                ) : (
                    <AddBoxOutlined fontSize="small" />
                )}
            </IconButton>
        </Box>
    );

    const renderAreaTree = (nodes, level = 0) => {
        if (!nodes) return null;
        return nodes.map((node) => {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = floorExpanded[node.area_code] || false;
            return (
                <Box key={node.area_code}>
                    <Box sx={areaSizeDataRowSx(level)}>
                        <Typography
                            component="span"
                            sx={{
                                ...areaSizeColNameSx,
                                maxWidth: node.name && node.name.length > 46 ? '46ch' : 'none',
                            }}
                        >
                            {node.name}
                        </Typography>
                        {renderValueCells(node.area_load, node.area_sqft, node.area_sqm)}
                        {hasChildren
                            ? renderExpandButton(isExpanded, () => toggleFloorExpand(node.area_code))
                            : <Box sx={areaSizeExpandSlotSx} />}
                    </Box>
                    {hasChildren && (
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            {renderAreaTree(node.children, level + 1)}
                        </Collapse>
                    )}
                </Box>
            );
        });
    };

    const total = areaData?.total || {};
    const floors = getAvailableFloors();

    const calculateFilteredTotals = () => {
        const roleLower = (currentUserRole || '').toLowerCase();
        if (roleLower === 'superadmin' || roleLower === 'admin') {
            return total;
        }
        if (roleLower === 'operator' && floors.length > 0) {
            return floors.reduce(
                (acc, floor) => ({
                    total_area_load: (acc.total_area_load || 0) + (floor.area_load || 0),
                    total_area_sqft: (acc.total_area_sqft || 0) + (floor.area_sqft || 0),
                    total_area_sqm: (acc.total_area_sqm || 0) + (floor.area_sqm || 0),
                }),
                { total_area_load: 0, total_area_sqft: 0, total_area_sqm: 0 }
            );
        }
        return total;
    };

    const displayTotal = calculateFilteredTotals();

    return (
        <Box sx={areaSizeTablePanelSx}>
            <Box sx={areaSizeTableHeaderRowSx}>
                <Typography component="span" sx={areaSizeColNameSx}>Area Name</Typography>
                <Typography component="span" sx={areaSizeColNumericSx}>Connected Load</Typography>
                <Typography component="span" sx={areaSizeColNumericSx}>Size In Sq ft</Typography>
                <Typography component="span" sx={areaSizeColNumericSx}>Total Area Sqm</Typography>
                <Box sx={areaSizeExpandSlotSx} />
            </Box>

            <Box sx={areaSizeTableScrollSx}>
                <Box sx={areaSizeTotalRowSx}>
                    <Typography component="span" sx={{ ...areaSizeColNameSx, fontWeight: 600, color: areaSizeText }}>
                        Total
                    </Typography>
                    {renderValueCells(
                        displayTotal.total_area_load,
                        displayTotal.total_area_sqft,
                        displayTotal.total_area_sqm
                    )}
                    {renderExpandButton(expanded, toggleExpand)}
                </Box>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    {floors.map((floor) => (
                        <Box key={floor.floor_id}>
                            <Box sx={areaSizeDataRowSx(0)}>
                                <Typography component="span" sx={{ ...areaSizeColNameSx, fontWeight: 500 }}>
                                    {floor.floor_name}
                                </Typography>
                                {renderValueCells(floor.area_load, floor.area_sqft, floor.area_sqm)}
                                {renderExpandButton(
                                    !!floorExpanded[floor.floor_id],
                                    () => toggleFloorExpand(floor.floor_id)
                                )}
                            </Box>
                            <Collapse in={floorExpanded[floor.floor_id]} timeout="auto" unmountOnExit>
                                {renderAreaTree(floor.tree, 1)}
                            </Collapse>
                        </Box>
                    ))}
                </Collapse>
            </Box>
        </Box>
    );
};

export default AreaSizeLoadTree;
