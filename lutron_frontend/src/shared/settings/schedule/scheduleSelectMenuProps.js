import { SCHEDULE_MODAL_OVERLAY_Z_INDEX } from './scheduleModalLayer';

const scheduleMenuItemSx = {
  color: 'var(--schedule-select-menu-text, #000)',
  fontSize: 14,
  minHeight: 36,
  '&:hover': {
    backgroundColor:
      'var(--schedule-select-menu-hover, var(--advanced-menu-item-hover-bg, rgba(61, 74, 92, 0.12))) !important',
  },
  '&.Mui-focusVisible': {
    backgroundColor:
      'var(--schedule-select-menu-hover, var(--advanced-menu-item-hover-bg, rgba(61, 74, 92, 0.12))) !important',
  },
  '&.Mui-selected': {
    backgroundColor:
      'var(--schedule-modal-item-selected-bg, var(--advanced-menu-item-selected-bg, #3d4a5c)) !important',
    color:
      'var(--schedule-modal-item-selected-text, var(--advanced-menu-item-selected-text, #fff)) !important',
  },
  '&.Mui-selected:hover': {
    backgroundColor:
      'var(--schedule-select-menu-selected-hover, var(--advanced-menu-item-selected-hover-bg, var(--schedule-modal-item-selected-bg, #3d4a5c))) !important',
    color:
      'var(--schedule-modal-item-selected-text, var(--advanced-menu-item-selected-text, #fff)) !important',
  },
  '&.Mui-selected.Mui-focusVisible': {
    backgroundColor:
      'var(--schedule-select-menu-selected-hover, var(--advanced-menu-item-selected-hover-bg, var(--schedule-modal-item-selected-bg, #3d4a5c))) !important',
    color:
      'var(--schedule-modal-item-selected-text, var(--advanced-menu-item-selected-text, #fff)) !important',
  },
};

/** Shared MUI Select menu styling (Schedule filter, Add Event, Action dialogs). */
export const scheduleFilterMenuProps = {
  PaperProps: {
    className: 'schedule-filter-menu',
    sx: {
      backgroundColor:
        'var(--schedule-select-menu-bg, var(--heatmap-select-menu-bg, #d6dde8))',
      borderRadius: '10px',
      mt: 0.5,
      boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
      '& .MuiMenuItem-root': scheduleMenuItemSx,
    },
  },
  MenuListProps: {
    className: 'schedule-filter-menu-list',
    sx: {
      py: 0.5,
      '& .MuiMenuItem-root': scheduleMenuItemSx,
    },
  },
};

/** Outlined Select field on schedule forms (Add Event, Schedule Details). */
export const scheduleSelectFieldSx = {
  borderRadius: '8px',
  fontSize: 14,
  backgroundColor: 'var(--schedule-select-bg, #fff)',
  color: 'var(--schedule-select-text, inherit)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--schedule-panel-border, #ccc)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--home-tab-active-color, #3d3629)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--home-tab-active-color, #3d3629)',
    borderWidth: '1px',
  },
  '& .MuiSelect-icon': {
    color: 'var(--schedule-select-text, inherit)',
  },
};

/** MUI Select menus inside portaled advanced schedule modals (above overlay z-index). */
export const scheduleModalFilterMenuProps = {
  ...scheduleFilterMenuProps,
  disableScrollLock: true,
  sx: { zIndex: SCHEDULE_MODAL_OVERLAY_Z_INDEX + 1 },
  PaperProps: {
    ...scheduleFilterMenuProps.PaperProps,
    sx: {
      ...scheduleFilterMenuProps.PaperProps.sx,
      zIndex: SCHEDULE_MODAL_OVERLAY_Z_INDEX + 1,
    },
  },
};

/** Customized variant — tan/beige hover + selection (not advanced slate). */
const customizedScheduleMenuItemSx = {
  color: '#000000',
  fontSize: 14,
  minHeight: 36,
  '&:hover': {
    backgroundColor: 'rgba(168, 156, 129, 0.35) !important',
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(168, 156, 129, 0.35) !important',
  },
  '&.Mui-selected': {
    backgroundColor: '#a89c81 !important',
    color: '#ffffff !important',
  },
  '&.Mui-selected:hover': {
    backgroundColor: '#96896f !important',
    color: '#ffffff !important',
  },
  '&.Mui-selected.Mui-focusVisible': {
    backgroundColor: '#96896f !important',
    color: '#ffffff !important',
  },
};

export const customizedScheduleModalFilterMenuProps = {
  disableScrollLock: true,
  sx: { zIndex: SCHEDULE_MODAL_OVERLAY_Z_INDEX + 1 },
  PaperProps: {
    className: 'schedule-filter-menu customized-schedule-filter-menu',
    sx: {
      backgroundColor: '#FFFFFF',
      borderRadius: '10px',
      mt: 0.5,
      boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
      zIndex: SCHEDULE_MODAL_OVERLAY_Z_INDEX + 1,
      '& .MuiMenuItem-root': customizedScheduleMenuItemSx,
    },
  },
  MenuListProps: {
    className: 'schedule-filter-menu-list',
    sx: {
      py: 0.5,
      '& .MuiMenuItem-root': customizedScheduleMenuItemSx,
    },
  },
};

export function resolveScheduleModalFilterMenuProps(scheduleCalendarChrome) {
  if (scheduleCalendarChrome === 'customized') {
    return customizedScheduleModalFilterMenuProps;
  }
  return scheduleModalFilterMenuProps;
}
