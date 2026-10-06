export function alertsWidgetPropsAreEqual(prevProps, nextProps) {
  if (prevProps.loading !== nextProps.loading) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.onClick !== nextProps.onClick) return false;
  if (prevProps.cardSx !== nextProps.cardSx) return false;

  if (prevProps.alerts !== nextProps.alerts) {
    if (prevProps.alerts && nextProps.alerts) {
      try {
        if (JSON.stringify(prevProps.alerts) === JSON.stringify(nextProps.alerts)) {
          return true;
        }
      } catch (e) {
        // fall through
      }
    }
    return false;
  }

  return true;
}

export function legacyAlertsWidgetStatus(props) {
  return props.loading ? 'loading' : 'ready';
}

export function sharedAlertsWidgetStatus(props) {
  return legacyAlertsWidgetStatus(props);
}
