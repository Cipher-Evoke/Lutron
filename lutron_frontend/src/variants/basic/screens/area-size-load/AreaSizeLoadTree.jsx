import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Collapse } from "@mui/material";
import { AddBoxOutlined, IndeterminateCheckBoxOutlined } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { fetchAreaLoadData, getAreaSizeLoadData } from "../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import { UseAuth } from '../../customhooks/UseAuth';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { isLightSurface } from '../../utils/themeOnSurface';
import { dispatchFetchAreaSizeLoadOnce } from "../../../../shared/utils/bootstrapFetchGuards";

const SECTION_HEADER_BLUE = '#1E74C5';

const AreaSizeLoadTree = () => {
    const dispatch = useDispatch();
    const areaData = useSelector(fetchAreaLoadData);
    const appTheme = useSelector(selectApplicationTheme);
    const contentColor = appTheme?.application_theme?.content || '#ffffff';
    const isDefaultWhiteTheme = isLightSurface(contentColor);
    const [expanded, setExpanded] = useState(false);
    const [floorExpanded, setFloorExpanded] = useState({});
    
    // Get user role and profile for floor filtering
    const { role: currentUserRole } = UseAuth();
    const userProfile = useSelector((state) => state.user?.profile);
    
    // Function to get available floors based on user permissions
    const getAvailableFloors = () => {
        const floors = areaData?.floors || [];
        
        // Ensure floors is an array
        if (!Array.isArray(floors) || floors.length === 0) {
            return [];
        }
        
        // Superadmin and Admin can see all floors
        const roleLower = (currentUserRole || '').toLowerCase();
        if (roleLower === 'superadmin' || roleLower === 'admin') {
            return floors;
        }
        
        // For Operators, only show floors they have access to
        if (roleLower === 'operator' && userProfile && userProfile.floors) {
            const operatorFloorIds = userProfile.floors.map(f => f.floor_id);
            return floors.filter(floor => operatorFloorIds.includes(floor.floor_id));
        }
        
        // Default: return all floors
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

    const renderAreaTree = (nodes, level = 0) => {
        if (!nodes) return null;
        return nodes.map((node) => {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = floorExpanded[node.area_code] || false;
            return (
                <Box key={node.area_code} sx={{ ml: level * 0.1, mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", flexGrow: 1 }}>
                            <Typography sx={{ 
                                width: "40%", 
                                color: "#000",
                                wordWrap: 'break-word',
                                whiteSpace: 'normal',
                                maxWidth: node.name && node.name.length > 46 ? '46ch' : 'none', // Wrap only when > 46 characters
                                overflow: 'visible'
                            }}>
                                {node.name}
                            </Typography>
                            <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(node.area_load || 0).toFixed(2)} W</Typography>
                            <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(node.area_sqft || 0).toFixed(2)}</Typography>
                            <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(node.area_sqm || 0).toFixed(2)}</Typography>
                        </Box>
                        {hasChildren && (
                            <IconButton size="small" onClick={() => toggleFloorExpand(node.area_code)}>
                                {isExpanded ? (
                                    <IndeterminateCheckBoxOutlined fontSize="small" sx={{ color: "#000" }} />
                                ) : (
                                    <AddBoxOutlined fontSize="small" sx={{ color: "#000" }} />
                                )}
                            </IconButton>
                        )}
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
    const floors = getAvailableFloors(); // Use filtered floors

    // Calculate totals based on filtered floors for operators
    const calculateFilteredTotals = () => {
        const roleLower = (currentUserRole || '').toLowerCase();
        if (roleLower === 'superadmin' || roleLower === 'admin') {
            // For Superadmin/Admin, use original totals
            return total;
        }
        
        // For Operators, calculate totals from filtered floors
        if (roleLower === 'operator' && floors.length > 0) {
            const filteredTotal = floors.reduce((acc, floor) => {
                return {
                    total_area_load: (acc.total_area_load || 0) + (floor.area_load || 0),
                    total_area_sqft: (acc.total_area_sqft || 0) + (floor.area_sqft || 0),
                    total_area_sqm: (acc.total_area_sqm || 0) + (floor.area_sqm || 0),
                };
            }, { total_area_load: 0, total_area_sqft: 0, total_area_sqm: 0 });
            
            return filteredTotal;
        }
        
        return total;
    };
    
    const displayTotal = calculateFilteredTotals();

    return (
        <Box sx={{ mt: 4 }}>
            {/* Heading Row */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    mb: 1,
                    backgroundColor: isDefaultWhiteTheme ? SECTION_HEADER_BLUE : 'transparent',
                    borderRadius: isDefaultWhiteTheme ? 1 : 0,
                    px: isDefaultWhiteTheme ? 1.5 : 0,
                    py: isDefaultWhiteTheme ? 1 : 0,
                }}
            >
                <Typography sx={{ width: '40%', color: isDefaultWhiteTheme ? '#fff' : '#000', fontWeight: 700 }}>
                    Area Name
                </Typography>
                <Typography sx={{ width: '20%', textAlign: 'right', color: isDefaultWhiteTheme ? '#fff' : '#000', fontWeight: 700 }}>
                    Connected Load
                </Typography>
                <Typography sx={{ width: '20%', textAlign: 'right', color: isDefaultWhiteTheme ? '#fff' : '#000', fontWeight: 700 }}>
                    Size In Sq ft
                </Typography>
                <Typography sx={{ width: '20%', textAlign: 'right', color: isDefaultWhiteTheme ? '#fff' : '#000', fontWeight: 700 }}>
                    Total Area Sqm
                </Typography>
            </Box>

            {/* Total Row */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", flexGrow: 1 }}>
                    <Typography sx={{ width: "40%", color: "#000", fontWeight: 600 }}>Total</Typography>
                    <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(displayTotal.total_area_load || 0).toFixed(2)} W</Typography>
                    <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(displayTotal.total_area_sqft || 0).toFixed(2)}</Typography>
                    <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(displayTotal.total_area_sqm || 0).toFixed(2)}</Typography>
                </Box>
                <IconButton size="small" onClick={toggleExpand}>
                    {expanded ? (
                        <IndeterminateCheckBoxOutlined fontSize="small" sx={{ color: "#000" }} />
                    ) : (
                        <AddBoxOutlined fontSize="small" sx={{ color: "#000" }} />
                    )}
                </IconButton>
            </Box>

            {/* Floors rendered here */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                {floors.map((floor) => (
                    <Box key={floor.floor_id} sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", flexGrow: 1 }}>
                                <Typography sx={{ width: "40%", color: "#000" }}>{floor.floor_name}</Typography>
                                <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(floor.area_load || 0).toFixed(2)} W</Typography>
                                <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(floor.area_sqft || 0).toFixed(2)}</Typography>
                                <Typography sx={{ width: "20%", textAlign: "right", color: "#000" }}>{(floor.area_sqm || 0).toFixed(2)}</Typography>
                            </Box>
                            <IconButton size="small" onClick={() => toggleFloorExpand(floor.floor_id)}>
                                {floorExpanded[floor.floor_id] ? (
                                    <IndeterminateCheckBoxOutlined fontSize="small" sx={{ color: "#000" }} />
                                ) : (
                                    <AddBoxOutlined fontSize="small" sx={{ color: "#000" }} />
                                )}
                            </IconButton>
                        </Box>
                        <Collapse in={floorExpanded[floor.floor_id]} timeout="auto" unmountOnExit>
                            {renderAreaTree(floor.tree)}
                        </Collapse>
                    </Box>
                ))}
            </Collapse>
        </Box>
    );
};

export default AreaSizeLoadTree;
