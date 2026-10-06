import { getUsersSettingsBindings } from './bindUsersSettingsModule';
import {
  getSettingsTableHeaderCellSx,
  getSettingsTableHeaderRowSx,
} from '../settingsTableHeaderStyles';
// src/screens/settings/UsersComponent.jsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
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
import { isLightSurface } from "../../theme/utils/themeOnSurface";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from "@mui/icons-material/Edit";
import CreateUser from './CreateUser';
import UpdateUser from "./UpdateUser";
export default function UsersComponent() {
  const {
    usersSlice: { fetchUsers, deleteUser, selectUsers, selectUsersLoading, selectUsersError, selectDeleteLoading, selectDeleteError, clearDeleteError },
    ConfirmDialog,
    SidebarItems,
    getVisibleSidebarItems,
    getVisibleSidebarItemsWithPaths,
    UseAuth,
    userlogin: { selectProfile },
    themeSlice: { selectApplicationTheme },
    settingsSidebarTabStyles: { settingsSidebarColumnDividerSx },
    SettingsSidebarNav,
    settingsUsersBreadcrumbParams: { SETTINGS_USERS_ACTION_QUERY },
    SettingsPageShell = null,
    usersListScrollEnabled = false,
  } = getUsersSettingsBindings();

  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const appTheme = useSelector(selectApplicationTheme);
  const backgroundColor = appTheme?.application_theme?.background || '#ffffff';
  const contentColor = appTheme?.application_theme?.content || '#ffffff';
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  const isDefaultWhiteTheme = isLightSurface(contentColor);
  const actionBlue = isDefaultWhiteTheme ? '#1565C0' : buttonColor;
  const tableHeaderText = isLightSurface(backgroundColor) ? '#000000' : '#ffffff';
  const tableHeaderRowSx = getSettingsTableHeaderRowSx(isDefaultWhiteTheme, backgroundColor);
  const tableHeaderCellSx = getSettingsTableHeaderCellSx(
    isDefaultWhiteTheme,
    backgroundColor,
    tableHeaderText
  );

  // Add responsive breakpoints
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up('md'));

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
  const [editUser, setEditUser] = useState(null);
  
  // Add confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const wasAnyModalOpenRef = useRef(false);
  const anyUserModalOpen = openModal || Boolean(editUser);

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

  // 6) When create or edit modal closes, refresh list (keeps permissions in sync with API)
  useEffect(() => {
    if (wasAnyModalOpenRef.current && !anyUserModalOpen) {
      dispatch(fetchUsers());
    }
    wasAnyModalOpenRef.current = anyUserModalOpen;
  }, [anyUserModalOpen, dispatch]);

  // 7) Filter users by searchTerm
  const filteredUsers = displayUsers.filter((u) =>
    (u.name || "").toLowerCase().includes(searchTerm.toLowerCase())
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

  const canUpdateUsers = () =>
    role === "Superadmin" || role === "Admin";
  
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

  const usersMainContent = (
      <>
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
              backgroundColor: isDefaultWhiteTheme ? '#fff' : contentColor,
              "& .MuiOutlinedInput-root": {
                backgroundColor: isDefaultWhiteTheme ? '#fff' : contentColor,
                "& fieldset": {
                  borderColor: isDefaultWhiteTheme ? '#ddd' : 'rgba(255,255,255,0.2)',
                },
                "&:hover fieldset": {
                  borderColor: isDefaultWhiteTheme ? '#ccc' : 'rgba(255,255,255,0.35)',
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
                  backgroundColor: actionBlue,
                  color: '#FFFFFF',
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: '6px',
                  '&:hover': {
                    backgroundColor: isDefaultWhiteTheme ? '#0d47a1' : '#555555',
                  },
                }}
              >
                Create User
              </Button>

              <CreateUser open={openModal} onClose={() => setOpenModal(false)} />
              <UpdateUser
                open={Boolean(editUser)}
                user={editUser}
                onClose={() => setEditUser(null)}
              />
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
                backgroundColor: isDefaultWhiteTheme ? '#fff' : backgroundColor,
                ...(usersListScrollEnabled
                  ? {
                      maxHeight: { xs: 'min(70vh, 520px)', md: 'calc(100vh - 220px)' },
                      overflowY: 'auto',
                      overflowX: 'auto',
                    }
                  : { overflow: 'hidden' }),
              }}
            >
            <Table stickyHeader={Boolean(usersListScrollEnabled)}>
              <TableHead>
                <TableRow
                  sx={{
                    ...tableHeaderRowSx,
                    ...(usersListScrollEnabled
                      ? {
                          '& .MuiTableCell-head': {
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                          },
                        }
                      : {}),
                  }}
                >
                  <TableCell sx={tableHeaderCellSx}>User</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Role</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Assigned Floors</TableCell>
                  {canUpdateUsers() && (
                    <TableCell sx={{ ...tableHeaderCellSx, textAlign: 'center' }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell colSpan={canUpdateUsers() ? 4 : 3} sx={{ textAlign: "center", py: 3 }}>
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
                        {canUpdateUsers() && (
                          <TableCell sx={{ color: '#000', textAlign: 'center' }}>
                            <Box sx={{ display: 'inline-flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Edit User" arrow placement="top">
                                <IconButton
                                  onClick={() => setEditUser(user)}
                                  sx={{
                                    backgroundColor: isDefaultWhiteTheme ? actionBlue : '#232323',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    p: 1,
                                    width: '34px',
                                    height: '30px',
                                    '&:hover': { backgroundColor: isDefaultWhiteTheme ? '#0d47a1' : '#333' },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete User" arrow placement="top">
                                <IconButton
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={deleteLoading}
                                  sx={{
                                    backgroundColor: isDefaultWhiteTheme ? actionBlue : '#232323',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    p: 1,
                                    width: '34px',
                                    height: '30px',
                                    '&:hover': { backgroundColor: isDefaultWhiteTheme ? '#0d47a1' : '#333' },
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
                            </Box>
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
      </>
  );

  if (SettingsPageShell) {
    return (
      <SettingsPageShell
        sidebarItems={visibleSidebarItemsWithPaths}
        NavigationComponent={SettingsSidebarNav}
        contentColor={contentColor}
      >
        {usersMainContent}
      </SettingsPageShell>
    );
  }

  return (
    <Grid
      container
      className="settings-layout-root"
      sx={{
        maxWidth: '100%',
        borderRadius: '10px',
        alignItems: 'flex-start',
        p: '18px',
        ml: '18px',
      }}
    >
      <Grid item xs={12} sx={{ pt: '18px', mb: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 0.5,
            mb: 1,
          }}
        >
          Settings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Box sx={{ height: '1px', width: '100%', backgroundColor: '#e5e7eb' }} />
          <Box sx={{ height: '1px', width: '100%', backgroundColor: '#e5e7eb' }} />
        </Box>
      </Grid>

      <Grid
        item
        xs={12}
        md={2}
        sx={{
          p: 0,
          ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp && !isTablet),
        }}
      >
        <SettingsSidebarNav items={visibleSidebarItemsWithPaths} />
      </Grid>

      <Grid
        item
        xs={12}
        md={10}
        className="settings-main-content-column"
        sx={{
          backgroundColor: isDefaultWhiteTheme ? '#ffffff' : contentColor,
          p: 3,
          borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
        }}
      >
        {usersMainContent}
      </Grid>
    </Grid>
  );
}
