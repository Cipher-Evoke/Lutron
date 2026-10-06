// src/screens/settings/UsersComponent.jsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Grid,
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  useMediaQuery,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from '@mui/icons-material/Delete';
import CreateUser from "../Users/CreateUser";
import {
  fetchUsers,
  deleteUser,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectDeleteLoading,
  selectDeleteError,
  clearDeleteError,
} from '../../../redux/slice/settingsslice/user/usersSlice'
import { ConfirmDialog } from '../../../utils/FeedbackUI';
import { SidebarItems, getVisibleSidebarItems } from '../../../utils/sidebarItems'
import { getVisibleSidebarItemsWithPaths, UseAuth } from '../../../customhooks/UseAuth'
import { selectProfile } from '../../../redux/slice/auth/userlogin'

export default function UsersComponent() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Add responsive breakpoints
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // 1) Redux state
  const apiUsers = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const apiError = useSelector(selectUsersError);
  const deleteLoading = useSelector(selectDeleteLoading);
  const deleteError = useSelector(selectDeleteError);

  // 2) Local state
  const [displayUsers, setDisplayUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  
  // Add confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // 3) Keep track of the previous value of openModal so we know "modal just closed"
  const wasOpenRef = useRef(false);

  // 4) On mount, fetch users if we have a token
  useEffect(() => {
    const token = localStorage.getItem("lutron");
    if (token) {
      dispatch(fetchUsers());
    }
  }, [dispatch]);

  // 5) Whenever apiUsers changes, copy into displayUsers (or fallback to localStorage)
  useEffect(() => {
    if (Array.isArray(apiUsers) && apiUsers.length > 0) {
      setDisplayUsers(apiUsers);
    } else {
      const stored = JSON.parse(localStorage.getItem("lutronUsers") || "[]");
      setDisplayUsers(stored);
    }
  }, [apiUsers]);

  // 6) Watch for "modal just closed → true→false" and re‐fetch users
  useEffect(() => {
    // If previously open, now false: modal just closed
    if (wasOpenRef.current && !openModal) {
      dispatch(fetchUsers());
    }
    wasOpenRef.current = openModal;
  }, [openModal, dispatch]);

  // 7) Filter users by searchTerm
  const filteredUsers = displayUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete user
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        await dispatch(deleteUser(userToDelete.id)).unwrap();
        setShowDeleteDialog(false);
        setUserToDelete(null);
        // Clear any delete errors
        dispatch(clearDeleteError());
      } catch (error) {
        // Error will be handled by the Redux state
      }
    }
  };

  const { role } = UseAuth();
  const userProfile = useSelector((state) => state.user?.profile);
  const visibleSidebarItems = getVisibleSidebarItems(role, userProfile);
  const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role, userProfile);
  
  // According to the access control sheet:
  // Settings-users / View list of users: Admin: Required, Operator-Monitor-Control-and-Edit: Required
  // Settings-users / Create new user: Admin: Only of role Operator, Operator-Monitor-Control-and-Edit: Not Required
  // Settings-users / Delete user: Admin: Only of role Operator, Operator-Monitor-Control-and-Edit: Not Required
  
  const canViewUsers = () => {
    // Superadmin and Admin can always view users
    if (role === 'Superadmin' || role === 'Admin') return true;
    // All Operators can view users (monitor, monitor_control, or monitor_control_edit)
    if (role === 'Operator' && userProfile && userProfile.floors && userProfile.floors.length > 0) {
      return true;
    }
    return false;
  };
  
  const canCreateUsers = () => {
    // Only Superadmin and Admin can create users
    return role === 'Superadmin' || role === 'Admin';
  };
  
  const canDeleteUsers = () => {
    // Only Superadmin and Admin can delete users
    return role === 'Superadmin' || role === 'Admin';
  };
  
  // Redirect if user doesn't have permission to view users - but wait for userProfile to load
  useEffect(() => {
    // Don't redirect if userProfile hasn't loaded yet (checking for both undefined and null as initial state)
    // Only redirect if we've confirmed userProfile exists but doesn't have permission
    if (role && userProfile !== undefined && !canViewUsers()) {
      navigate('/manage-area-groups', { replace: true });
    }
  }, [role, userProfile, navigate]);
  
  // Show loading state if userProfile is still loading
  if (!role || userProfile === undefined) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Don't render if user doesn't have permission
  if (!canViewUsers()) {
    return null;
  }

  return (

    <Grid
      container
      sx={{ml:'18px'}}
    >
      {/* Sidebar */}
      <Grid
        item
        xs={12}
        md={3}
        sx={{
          p: 2,
          borderTopLeftRadius: "10px",
          borderBottomLeftRadius: "10px",
        }}
      >
         <Typography variant="h6" sx={{
                            mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                            color: theme.palette.text.secondary,
                            fontSize: 24,
                            fontWeight: 600,
                            letterSpacing: 0.5,
                            paddingTop: "18px",
                            marginBottom:'16px'
                        }}>
          Settings
        </Typography>

        
        {/* Responsive sidebar items layout */}
        <Box sx={{
          display: 'flex',
          flexDirection: isTablet ? 'row' : 'column',
          flexWrap: isTablet ? 'wrap' : 'nowrap',
          gap: isTablet ? 1 : 0,
          justifyContent: isTablet ? 'flex-start' : 'flex-start',
          alignItems: isTablet ? 'flex-start' : 'stretch'
        }}>
          {visibleSidebarItemsWithPaths.map((item) => (
            <Box
              key={item.label}
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
                }
              }}
              sx={{
                backgroundColor:
                  location.pathname === item.path
                    ? theme.palette.custom.containerBg
                    : "transparent",
                color:
                  location.pathname === item.path
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                px: isTablet ? 1.5 : 2,
                py: isTablet ? 0.8 : 1,
                borderRadius: "4px",
                mb: isTablet ? 0 : 0.8,
                mr: isTablet ? 1 : 0,
                fontSize: isTablet ? '11px' : '14px',
                fontWeight: location.pathname === item.path ? 600 : 400,
                cursor: "pointer",
                minWidth: isTablet ? 'auto' : '100%',
                textAlign: isTablet ? 'center' : 'left',
                whiteSpace: isTablet ? 'nowrap' : 'normal',
                "&:hover": {
                  backgroundColor: theme.palette.custom.containerBg,
                },
                // Tablet-specific styling
                ...(isTablet && {
                  flex: '0 0 auto',
                  border: '1px solid rgba(255,255,255,0.1)',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                })
              }}
            >
              {item.label}
            </Box>
          ))}
        </Box>

      </Grid>

      {/* Main Content */}
      <Grid
        item
        xs={12}
        md={9}
        sx={{
          p: 6,
          borderTopRightRadius: "10px",
          borderBottomRightRadius: "10px",
        }}
      >
        {/* Search bar + "Create User" button */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            variant="outlined"
            sx={{
              width: 300,
              borderRadius: 1,
              backgroundColor: "#fff",
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#fff",
                "& fieldset": {
                  borderColor: "#ddd",

                },
                "&:hover fieldset": {
                  borderColor: "#ccc",
                },

              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {(role === 'Superadmin' || role === 'Admin') && (
            <>
              <Button
                variant="contained"
                onClick={() => setOpenModal(true)}
                sx={{
                  backgroundColor: theme.palette.custom.buttonBg,
                  color: theme.palette.text.secondary,
                  textTransform: "none",
                  px: 3,
                  py: 1,
                  borderRadius: "6px",
                  "&:hover": {
                    backgroundColor: theme.palette.custom.buttonBg,
                  },
                }}
              >
                Create User
              </Button>

              <CreateUser open={openModal} onClose={() => setOpenModal(false)} />
            </>
          )}
        </Box>

        {/* If the API is loading, show a spinner */}
        {loading && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        )}

        {/* If the API returned an error (e.g. 401 unauthorized) */}
        {apiError && !loading && (
          // <Alert severity="error" sx={{ mb: 2 }}>
          //   {apiError}
          // </Alert>
          null
        )}

        {/* Once loading is done & no error, show either "No users" or the table */}
        {!loading && !apiError && (
          <TableContainer

              component={Paper}
              sx={{
                width: '80%',              // Reduce width to 80%
                maxWidth: '900px',         // Optional: add max width
                mx: '1',                // Center horizontally
                mt: 2,
                borderRadius: 1,
                overflow: "hidden",
                backgroundColor: '#CDC0A0',
              }}
            >
            <Table>
              <TableHead>
                <TableRow
                  sx={{ backgroundColor: '#CDC0A0'}}

                >
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#000',
                    }}
                  >
                    User
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#000',
                    }}
                  >
                    Role
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#000',
                    }}
                  >
                    Assigned Floors
                  </TableCell>
                  {canDeleteUsers() && (
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: '#000',
                        textAlign: 'center',
                      }}
                    >
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell colSpan={canDeleteUsers() ? 4 : 3} sx={{ textAlign: "center", py: 3 }}>
                      <Typography sx={{ color: '#000' }}>
                        No users found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const userPermissions = user.user_permissions || [];
                    return (
                      <TableRow key={user.id} sx={{ backgroundColor: '#fff' }}>
                        <TableCell sx={{ color: '#000' }}>
                          {user.name}
                        </TableCell>
                        <TableCell sx={{ color: '#000' }}>
                          {user.role}
                        </TableCell>
                        <TableCell sx={{ color: '#000' }}>
                          {(() => {
                            // For Superadmin and Admin with no specific permissions, show nothing
                            if ((user.role === 'Superadmin' || user.role === 'Admin') && userPermissions.length === 0) {
                              return null;
                            }
                            
                            // For operators or users with permissions, show assigned floors as oval buttons
                            if (userPermissions.length > 0) {
                              return (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                  {userPermissions.map((permission, idx) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        backgroundColor: '#f5f5f5',
                                        border: '1px solid #ddd',
                                        borderRadius: '20px', // Oval/pill shape
                                        px: 1.5,
                                        py: 0.5,
                                        gap: 0.5,
                                        minHeight: '28px',
                                        width: 'fit-content',
                                      }}
                                    >
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontSize: '0.75rem',
                                          color: '#000',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {permission.floor_name}
                                      </Typography>
                                      {permission.permission_type && (
                                        <Typography
                                          component="span"
                                          sx={{
                                            fontSize: '0.7rem',
                                            color: '#666',
                                            fontWeight: 400,
                                          }}
                                        >
                                          {permission.permission_type}
                                        </Typography>
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              );
                            }
                            
                            // For other roles without permissions
                            return (
                              <Typography sx={{ color: '#666', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                No floors assigned
                              </Typography>
                            );
                          })()}
                        </TableCell>
                        {canDeleteUsers() && (
                          <TableCell sx={{ color: '#000', textAlign: 'center' }}>
                            <Tooltip title="Delete User" arrow placement="top">
                              <IconButton
                                onClick={() => handleDeleteUser(user)}
                                disabled={deleteLoading}
                                sx={{
                                  backgroundColor: '#1E1E1E',
                                  color: '#fff',
                                  borderRadius: '6px',
                                  p: 1,
                                  width: '34px',
                                  height: '30px',
                                  '&:hover': { backgroundColor: '#333' },
                                  '&:disabled': { backgroundColor: '#666' }
                                }}
                              >
                                {deleteLoading ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <DeleteIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Delete User Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          title="Delete User"
          message={`Are you sure you want to delete user "${userToDelete?.name}"?`}
          onConfirm={confirmDeleteUser}
          onCancel={() => {
            setShowDeleteDialog(false);
            setUserToDelete(null);
          }}
        />

        {/* Error Snackbar for delete operations */}
        {deleteError && (
          <Box sx={{ mt: 2 }}>
            <Alert 
              severity="error" 
              onClose={() => dispatch(clearDeleteError())}
              sx={{ backgroundColor: '#fff' }}
            >
              {deleteError}
            </Alert>
          </Box>
        )}
      </Grid>
    </Grid>

  );
}