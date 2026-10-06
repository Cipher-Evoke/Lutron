/**
 * Customized variant modal helpers — prevent tan body gutters when MUI scroll-lock shifts layout.
 */

/** Use on any customized MUI Dialog (transparent backdrop, no scroll-lock shift). */
export const customizedModalBackdropProps = {
  disableScrollLock: true,
  BackdropProps: {
    sx: { backgroundColor: 'transparent' },
  },
};

/**
 * Users Create/Edit modals — match advanced variant dialog chrome:
 * transparent MUI backdrop/paper with panel styling on an inner shell box.
 */
export const customizedUsersDialogChrome = {
  ...customizedModalBackdropProps,
  useModalShell: true,
  dialogProps: {
    BackdropProps: customizedModalBackdropProps.BackdropProps,
    PaperProps: {
      sx: {
        backgroundColor: 'transparent',
        boxShadow: 'none',
        maxHeight: '80vh',
      },
    },
  },
  getModalShellSx: (theme) => ({
    background: theme.palette.custom?.containerBg || theme.palette.custom.containerBg,
    borderRadius: '16px',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }),
};

export default customizedModalBackdropProps;
