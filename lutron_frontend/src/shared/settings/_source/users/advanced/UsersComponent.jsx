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
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CreateUser from "../Users/CreateUser";
import UpdateUser from "./UpdateUser";
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
import { UseAuth } from '../../../customhooks/UseAuth'
import SettingsLayout from '../SettingsLayout'
import { selectProfile } from '../../../redux/slice/auth/userlogin'
import { selectApplicationTheme } from '../../../redux/slice/theme/themeSlice'
import { getThemeButtonColor } from '../../../utils/themePageBackground';
import { usersFormFieldSx } from './userSelectMenuProps';

export default function UsersComponent() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1) Redux state
  const apiUsers = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const apiError = useSelector(selectUsersError);
  const deleteLoading = useSelector(selectDeleteLoading);
  const deleteError = useSelector(selectDeleteError);
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);

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

  // 6) When create or edit modal closes, refresh list
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
    role === 'Superadmin' || role === 'Admin';

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

    <>
        <SettingsLayout>
        {/* Search bar + "Create User" button */}
        <Box
          className="settings-page-toolbar"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2,
            width: "100%",
            minWidth: 0,
          }}
        >
          <TextField
            className="users-search-field"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            variant="outlined"
            sx={{
              width: { xs: "100%", sm: 280, md: 300 },
              maxWidth: "100%",
              ...usersFormFieldSx,
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
                  backgroundColor: buttonColor,
                  color: '#fff',
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: buttonColor,
                    opacity: 0.92,
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
            className="settings-responsive-table"
            component={Paper}
            sx={{
              width: '100%',
              maxWidth: '100%',
              mx: 0,
              mt: 2,
              borderRadius: 1,
              overflowX: 'auto',
              backgroundColor: 'var(--users-table-container-bg, #d6dde8)',
              border: '1px solid var(--users-border, #C5CDD8)',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'var(--users-table-head-bg, #d6dde8)' }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#1c2330',
                    }}
                  >
                    User
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#1c2330',
                    }}
                  >
                    Role
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#1c2330',
                    }}
                  >
                    Assigned Floors
                  </TableCell>
                  {canUpdateUsers() && (
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: '#1c2330',
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
                  <TableRow sx={{ backgroundColor: 'var(--users-table-row-bg, #fff)' }}>
                    <TableCell colSpan={canUpdateUsers() ? 4 : 3} sx={{ textAlign: "center", py: 3 }}>
                      <Typography sx={{ color: '#1c2330' }}>
                        No users found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const userPermissions = user.user_permissions || [];
                    return (
                      <TableRow key={user.id} sx={{ backgroundColor: 'var(--users-table-row-bg, #fff)' }}>
                        <TableCell sx={{ color: '#1c2330' }}>
                          {user.name}
                        </TableCell>
                        <TableCell sx={{ color: '#1c2330' }}>
                          {user.role}
                        </TableCell>
                        <TableCell sx={{ color: '#1c2330' }}>
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
                                        backgroundColor: 'var(--users-chip-bg, #D6DDE8)',
                                        border: '1px solid var(--users-border, #C5CDD8)',
                                        borderRadius: '20px',
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
                                          color: '#1c2330',
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
                                            color: '#4A586C',
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
                          <TableCell sx={{ color: '#1c2330', textAlign: 'center' }}>
                            <Box sx={{ display: 'inline-flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Edit User" arrow placement="top">
                                <IconButton
                                  onClick={() => setEditUser(user)}
                                  sx={{
                                    backgroundColor: buttonColor,
                                    color: '#fff',
                                    borderRadius: '6px',
                                    p: 1,
                                    width: '34px',
                                    height: '30px',
                                    '&:hover': { backgroundColor: buttonColor, opacity: 0.9 },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {canDeleteUsers() && (
                                <Tooltip title="Delete User" arrow placement="top">
                                  <IconButton
                                    onClick={() => handleDeleteUser(user)}
                                    disabled={deleteLoading}
                                    sx={{
                                      backgroundColor: buttonColor,
                                      color: '#fff',
                                      borderRadius: '6px',
                                      p: 1,
                                      width: '34px',
                                      height: '30px',
                                      '&:hover': { backgroundColor: buttonColor, opacity: 0.9 },
                                      '&:disabled': { backgroundColor: '#9aa3b0' },
                                    }}
                                  >
                                    {deleteLoading ? (
                                      <CircularProgress size={16} color="inherit" />
                                    ) : (
                                      <DeleteIcon />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}
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
        </SettingsLayout>

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
}
