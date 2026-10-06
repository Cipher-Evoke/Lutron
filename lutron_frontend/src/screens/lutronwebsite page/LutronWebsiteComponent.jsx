
import React, { useEffect, useState, useRef } from 'react';
import { resolvePublicAssetUrl } from '../../../shared/utils/resolveMediaUrl';
import { sanitizeRichHtml } from '../../../shared/html/sanitizeRichHtml';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { darken } from '@mui/material/styles';
import {
  getLutronData,
  getLutronDataClient,
  getLutronDataProject,
  homeDataList,
  homeDataClient,
  homeDataProject,
} from '../../redux/slice/home/homeSlice';
import { IoLocationOutline } from "react-icons/io5";
import { TfiViewList } from "react-icons/tfi";
import { useNavigate } from 'react-router-dom';
import { Link } from '@mui/material';
import { selectProfile } from "../../redux/slice/auth/userlogin"; // adjust path as needed

const ALL_SOLUTIONS = [
  'Smart Lighting Controls',
  'Automated Shades',
  'Mobile App Control',
  // Add more solutions here if needed
];

const MODES = [
  { key: 'Lutron', label: 'Lutron', fetch: getLutronData, selector: homeDataList },
  { key: 'ARM', label: 'ARM', fetch: getLutronDataClient, selector: homeDataClient },
  { key: 'Project', label: 'Project', fetch: getLutronDataProject, selector: homeDataProject },
];

const CARD_HEIGHT_RESPONSIVE = {
  maxHeight: {
    xs: 'none',
    sm: 'calc(100vh - 360px)',
    md: 'calc(100vh - 370px)',
    lg: 'calc(100vh - 370px)',
    xl: 'calc(100vh - 370px)'
  }
};

const CARD_SCROLL_STYLES = {
  overflowY: 'auto',
  overflowX: 'hidden',
  pr: { xs: 0, sm: 0, md: 1, lg: 1 },
  pb: 2,
  scrollbarWidth: 'thin',
  scrollbarColor: '#8b8b8b rgba(0,0,0,0.08)',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#8b8b8b',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.08)',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: '10px',
  },
};

const CARD_TEXT_SIZES = { xs: 12, sm: 13, md: 14, lg: 15 };

// Pass through HTML so editor spacing is preserved
const passthroughHtml = (html) => html || '';

// Helper function to format Google Maps URL
const formatGoogleMapsUrl = (locationLink, address) => {
  if (!locationLink && !address) return '#';
  
  // If locationLink is already a Google Maps URL, use it
  if (locationLink && (locationLink.includes('maps.google.com') || locationLink.includes('goo.gl/maps') || locationLink.includes('maps.app.goo.gl'))) {
    return locationLink;
  }
  
  // If locationLink is a Google Maps share link, use it
  if (locationLink && locationLink.startsWith('https://maps.app.goo.gl/')) {
    return locationLink;
  }
  
  // If we have an address, create a Google Maps search URL
  if (address) {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }
  
  // If we have locationLink but it's not a Google Maps URL, treat it as a search query
  if (locationLink) {
    const encodedLocation = encodeURIComponent(locationLink);
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  }
  
  return '#';
};

const LutronWebsiteComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux selectors
  const lutronData = useSelector(homeDataList);
  const amazonData = useSelector(homeDataClient);
  const projectData = useSelector(homeDataProject);
  const homeLutron = useSelector(homeDataList);
  const homeClient = useSelector(homeDataClient);
  const homeProject = useSelector(homeDataProject);
  
  const floorId = homeProject?.floor_id || null;

  // UI state
  const [displayMode, setDisplayMode] = useState('Lutron');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [area, setArea] = useState('');
  const [installedSolutions, setInstalledSolutions] = useState([]);
  // Search functionality commented out
  // const [searchText, setSearchText] = useState('');
  // const [filteredDescription, setFilteredDescription] = useState('');
  // const [filteredSolutions, setFilteredSolutions] = useState([]);

  const profile = useSelector(selectProfile);
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';

  // Refs to track if data has been loaded to prevent infinite API calls
  const dataLoadedRef = useRef({
    lutron: false,
    client: false,
    project: false
  });

  // Create dynamic MODES array based on client data
  const getDynamicModes = () => {
    const clientName = homeClient?.name || 'ARM'; // Default to 'ARM' if no client name
    return [
      { key: 'Lutron', label: 'Lutron', fetch: getLutronData, selector: homeDataList },
      { key: 'ARM', label: clientName, fetch: getLutronDataClient, selector: homeDataClient },
      { key: 'Project', label: 'Project', fetch: getLutronDataProject, selector: homeDataProject },
    ];
  };

  // Add/remove CSS class to body for responsive behavior
  useEffect(() => {
    document.body.classList.add('lutron-page');
    document.getElementById('root')?.classList.add('lutron-page');
    
    return () => {
      document.body.classList.remove('lutron-page');
      document.getElementById('root')?.classList.remove('lutron-page');
    };
  }, []);

  // Fetch data on component mount only - FIXED: Remove redundant calls
  useEffect(() => {
    // Only fetch if not already loaded
    if (!dataLoadedRef.current.lutron && (!lutronData || !lutronData.description)) {
      dataLoadedRef.current.lutron = true;
      dispatch(getLutronData());
    }
    if (!dataLoadedRef.current.client && (!amazonData || !amazonData.name)) {
      dataLoadedRef.current.client = true;
      dispatch(getLutronDataClient());
    }
    if (!dataLoadedRef.current.project && (!projectData || !projectData.name)) {
      dataLoadedRef.current.project = true;
      dispatch(getLutronDataProject());
    }
  }, [dispatch]); // Only depend on dispatch to prevent infinite loops

  // Reset search and filtered state on tab change - COMMENTED OUT
  // useEffect(() => {
  //   setSearchText('');
  //   setFilteredDescription('');
  //   setFilteredSolutions([]);
  // }, [displayMode]);

  // Sync local state with Redux data
  useEffect(() => {
    if (displayMode === 'Lutron' && lutronData && lutronData.description) {
      const raw = lutronData.background_image || '';
      setBackgroundImage(resolvePublicAssetUrl(raw));
      setDescription(passthroughHtml(lutronData.description));
      setLocation('');
      setLocationLink('');
      setArea('');
      // Installed solutions not supported for Lutron mode
      setInstalledSolutions([]);
    } else if (displayMode === 'ARM' && amazonData && amazonData.description) {
      const raw = amazonData.background_image || '';
      setBackgroundImage(resolvePublicAssetUrl(raw));
      setDescription(passthroughHtml(amazonData.description));
      setLocation('');
      setLocationLink('');
      setArea('');
      // Installed solutions not supported for ARM mode
      setInstalledSolutions([]);
    } else if (displayMode === 'Project' && projectData && projectData.description) {
      // Project mode: no background image, but show location/area if present
      setBackgroundImage('');
      setDescription(passthroughHtml(projectData.description));
      setLocation(projectData.address || '');
      setLocationLink(projectData.location_link || '');
      setArea(
        projectData.overall_area_size
          ? `${projectData.overall_area_size.toLocaleString()} sq ft`
          : ''
      );
      // Load installed solutions from Redux data
      if (projectData.installed_solutions) {
        try {
          const solutions = typeof projectData.installed_solutions === 'string' 
            ? JSON.parse(projectData.installed_solutions)
            : projectData.installed_solutions;
          // Handle array of objects with 'solution' key
          if (Array.isArray(solutions)) {
            const solutionNames = solutions.map(item => item.solution || item);
            setInstalledSolutions(solutionNames);
          } else {
            setInstalledSolutions([]);
          }
        } catch (error) {
          console.error('Error parsing installed solutions:', error);
          setInstalledSolutions([]);
        }
      } else {
        setInstalledSolutions([]);
      }
    } else {
      setBackgroundImage('');
      setDescription('');
      setLocation('');
      setLocationLink('');
      setArea('');
      setInstalledSolutions([]);
    }
  }, [displayMode, lutronData, amazonData, projectData]);

  // Search/filter logic - COMMENTED OUT
  // useEffect(() => {
  //   if (searchText.length > 0) {
  //     const searchLower = searchText.toLowerCase();
      
  //     // Search in description
  //     const cleanDescription = stripHtmlTags(description);
  //     const descriptionLower = cleanDescription.toLowerCase();
  //     const hasMatchInDescription = descriptionLower.includes(searchLower);
      
  //     // Search in location and area content
  //     const locationLower = (location || '').toLowerCase();
  //     const areaLower = (area || '').toLowerCase();
  //     const hasMatchInLocation = locationLower.includes(searchLower);
  //     const hasMatchInArea = areaLower.includes(searchLower);
      
  //     // Search in solutions
  //     const matchingSolutions = ALL_SOLUTIONS.filter((item) =>
  //       item.toLowerCase().includes(searchLower)
  //     );
      
  //     // Set filtered description - show full description if there's a match anywhere
  //     const hasAnyMatch = hasMatchInDescription || hasMatchInLocation || hasMatchInArea || matchingSolutions.length > 0;
  //     setFilteredDescription(hasMatchInDescription ? cleanDescription : '');
      
  //     // Set filtered solutions
  //     setFilteredSolutions(matchingSolutions);
      
  //     // If no matches found anywhere, show "No results found"
  //     if (!hasAnyMatch) {
  //       setFilteredDescription('');
  //       setFilteredSolutions([]);
  //     }
  //   } else {
  //     setFilteredDescription('');
  //     setFilteredSolutions([]);
  //   }
  // }, [searchText, description, location, area]);

  // REMOVED: Redundant useEffect that was calling getLutronDataClient again
  // useEffect(() => {
  //   if (profile && profile.access_token) {
  //     dispatch(getLutronDataClient());
  //   }
  // }, [dispatch, profile]);

  return (
    <Box className="lutron-website-container" sx={{ 
      width: '100%', 
      minHeight: 'calc(100vh - 200px)', 
      height: 'auto',
      maxHeight: 'none',
      display: 'flex', 
      flexDirection: 'column', 
      boxSizing: 'border-box',
      overflowX: 'hidden',
      overflowY: 'auto',
      pb: 4
    }}>
      {/* Mode Buttons Only - Search commented out */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: 'none',
          py: 1,
          px: { xs: 1, sm: 1, md: 1, lg: 0.5, xl: 0.5 },
          p: { xs: 2, sm: 2.5, md: 3, lg: 2, xl: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: { xs: 'column', sm: 'row' }, // <-- stack on mobile, row on larger
          gap: 2, // space between search and tabs
          overflow: 'hidden',
        }}
      >
        {/* Search TextField commented out */}
        {/* <TextField
          placeholder="Search this page"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            flex: 1, // <-- take available space
            minWidth: { xs: '100%', sm: '200px', md: '250px', lg: '250px' },
            maxWidth: { xs: '100%', sm: '400px', md: '500px', lg: '600px' },
            backgroundColor: 'white',
            borderRadius: '6px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '4px',
            },
            mb: { xs: 1, sm: 0, md: 0, lg: 0 },
          }}
        /> */}

        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#5b5342',
            px: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
            py: { xs: 0.8, sm: 1, md: 1.2, lg: 1.4 },
            gap: { xs: 0.4, sm: 0.5, md: 0.6, lg: 0.8 },
            flexShrink: 0,
            minWidth: { xs: '100%', sm: 'auto', md: 'auto', lg: 'auto' },
            flex: 1,
            maxWidth: { xs: '100%', sm: '350px', md: '400px', lg: '420px' },
            borderRadius: { xs: '12px', sm: '14px', md: '16px', lg: '18px' },
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          {getDynamicModes().map((mode) => {
            // Calculate dynamic width based on text length - more generous spacing
            const textLength = mode.label.length;
            const baseWidth = { xs: 60, sm: 70, md: 80, lg: 90 };
            const extraWidth = Math.max(0, (textLength - 6) * 12); // Add 12px per extra character beyond 6
            
            return (
              <Button
                key={mode.key}
                onClick={() => setDisplayMode(mode.key)}
                sx={{
                  width: { 
                    xs: `${baseWidth.xs + extraWidth}px`, 
                    sm: `${baseWidth.sm + extraWidth}px`, 
                    md: `${baseWidth.md + extraWidth}px`, 
                    lg: `${baseWidth.lg + extraWidth}px` 
                  },
                  height: { xs: '32px', sm: '34px', md: '36px', lg: '38px' },
                  backgroundColor: displayMode === mode.key ? '#fff' : buttonColor,
                  color: displayMode === mode.key ? buttonColor : '#fff',
                  borderRadius: '50%', // More pronounced pill shape
                  fontWeight: 'bold',
                  border: `1px solid ${buttonColor}`,
                  textTransform: 'none',
                  minWidth: 'unset',
                  padding: { xs: '0 10px', sm: '0 12px', md: '0 14px', lg: '0 16px' },
                  fontSize: { xs: '11px', sm: '12px', md: '13px', lg: '14px' },
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: displayMode === mode.key ? '#f5f5f5' : darken(buttonColor, 0.12),
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {mode.label}
              </Button>
            );
          })}
        </Paper>
      </Box>

     

      {/* Project mode: show extra info, otherwise show background image */}
      {displayMode === 'Project' ? (
        <Box
          sx={{
            width: '100%',
            flex: { xs: '1 0 auto', md: 1 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 2, md: 2, lg: 6, xl: 6 },
            py: 4,
            borderRadius: '8px',
            gap: 4,
            minHeight: 'auto',
            height: 'auto',
            maxHeight: 'none'
          }}
        >
          {/* Left Description Box */}
          <Box
            className="lutron-content-scrollable"
            sx={{
              width: { xs: '100%', md: '45%' },
              maxWidth: { xs: '100%', md: '50%' },
              backgroundColor: 'white',
              p: { xs: 2, sm: 2.5, md: 3, lg: 4 },
              borderRadius: { xs: '8px', sm: '10px', md: '12px', lg: '12px' },
              minHeight: 'fit-content',
              flex: '1 1 0',
              ...CARD_HEIGHT_RESPONSIVE,
              ...CARD_SCROLL_STYLES,
            }}
          >
            <Typography
              component="div"
              sx={{ 
                fontSize: CARD_TEXT_SIZES,
                fontWeight: 600,
                lineHeight: { xs: 1.3, sm: 1.4, md: 1.5, lg: 1.5 },
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                textAlign: 'left',
                '& p': { margin: '0 0 8px 0' }
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(description || 'No description available.') }}
            />
          </Box>

          {/* Right Info and Solutions */}
          <Box sx={{ 
            width: { xs: '100%', md: '45%' }, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            alignItems: 'flex-start',
            flex: '0 0 auto',
            minHeight: 'fit-content'
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: 2,
              width: '100%', // Ensure full width
            }}>
              <Paper sx={{
                flex: 1,
                width: { xs: '100%', sm: '250px' },
                height: 'auto',
                minHeight: '150px',
                p: 3,
                borderRadius: 1,
                backgroundColor: 'white'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IoLocationOutline fontSize="large" />
                  <Typography
                    sx={{
                      fontSize: CARD_TEXT_SIZES,
                    fontWeight: 600,
                    }}
                  >
                    Location
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: CARD_TEXT_SIZES,
                  fontWeight: 400,
                    mt: 1,
                  }}
                >
                  {location || '---'}
                </Typography>
                {(locationLink || location) && (
                  <Link
                    href={formatGoogleMapsUrl(locationLink, location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ 
                      fontSize: CARD_TEXT_SIZES,
                      mt: 2, 
                      display: 'inline-block',
                      cursor: 'pointer',
                    }}
                  >
                    Open Maps →
                  </Link>
                )}
              </Paper>

              <Paper
                sx={{
                  flex: 1,
                  p: 3,
                  width: { xs: '100%', sm: '250px' },
                  height: 'auto',
                  minHeight: '150px',
                  borderRadius: 1,
                  backgroundColor: 'white',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0 }}>
                  <TfiViewList fontSize="large" />
                  <Typography
                    sx={{
                      fontSize: CARD_TEXT_SIZES,
                    fontWeight: 600,
                    }}
                  >
                    Area
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: CARD_TEXT_SIZES,
                  fontWeight: 400,
                    mt: 1,
                  }}
                >
                  {area || '---'}
                </Typography>
                <Typography
                  sx={{
                    color: 'black',
                    fontSize: CARD_TEXT_SIZES,
                    cursor: 'pointer',
                    mt: 2,
                  }}
                  onClick={() => navigate('/heatmap')}
                >
                  Floor Plan →
                </Typography>
              </Paper>
            </Box>

            {/* Installed Solutions */}
            <Typography
              sx={{
              color: 'white', 
                fontSize: CARD_TEXT_SIZES,
              fontWeight: 600,
              }}
            >
              Installed Solutions
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              width: '100%', // Ensure full width
            }}>
              {installedSolutions.length > 0 ? (
                installedSolutions.map((solution, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: '1 1 calc(50% - 8px)', // 2 solutions per line
                      borderRadius: '8px',
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      px: 2,
                      py: 1.5,
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: CARD_TEXT_SIZES,
                      fontWeight: 400,
                      color: '#000',
                      }}
                    >
                      {solution}
                    </Typography>
                  </Box>
                ))
              ) : (
                // Show message when no solutions are available
                <Box sx={{
                  width: '100%',
                  textAlign: 'center',
                  py: 4,
                  px: 2,
                }}>
                  <Typography
                    sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: CARD_TEXT_SIZES,
                    fontStyle: 'italic',
                    }}
                  >
                    No installed solutions available. Add solutions in the settings page.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            flex: { xs: '1 0 auto', md: 1 },
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            px: { xs: 1, sm: 1.5, md: 2, lg: 2, xl: 4 },
            py: { xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 },
            borderRadius: '8px',
            minHeight: 'auto',
            height: 'auto',
            maxHeight: 'none',
            overflow: 'visible',
            boxSizing: 'border-box'
          }}
        >
          <Box
            className="lutron-content-scrollable"
            sx={{
              width: { xs: '95%', sm: '70%', md: '55%', lg: '48%', xl: '48%' },
              maxWidth: { xs: 'none', sm: '560px', md: '620px', lg: '760px', xl: '780px' },
              backgroundColor: 'white',
              p: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 4 },
              borderRadius: { xs: '6px', sm: '8px', md: '10px', lg: '12px', xl: '16px' },
              boxShadow: 6,
              opacity: 0.98,
              ml: { xs: 1, sm: 2, md: 3, lg: 4, xl: 6 },
              mb: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 4 },
              ...CARD_HEIGHT_RESPONSIVE,
              ...CARD_SCROLL_STYLES,
            }}
          >
            {/* Show description - Search functionality commented out */}
            {description &&
              description.trim().toLowerCase() !== 'no description available.' && (
                <Typography
                  component="div"
                  sx={{
                    fontSize: CARD_TEXT_SIZES,
                    fontWeight: 600,
                    lineHeight: { xs: 1.3, sm: 1.4, md: 1.5, lg: 1.5 },
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    textAlign: 'left',
                    '& p': { margin: '0 0 8px 0' }
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(description) }}
                />
              )}
            
          
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LutronWebsiteComponent;