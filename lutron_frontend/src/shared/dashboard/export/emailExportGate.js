export const EMAIL_SERVER_NOT_CONFIGURED_MESSAGE = 'Email Server settings not configured';

export const EMAIL_PROFILE_MISSING_MESSAGE =
  'No email address found for logged-in user. Please check your profile.';

export function isEmailServerConfigValid(config) {
  if (!config || typeof config !== 'object') return false;

  const hasServerName = config.server_name && config.server_name.trim() !== '';
  const hasPort = config.port && config.port > 0;
  const hasServerEmail = config.server_email && config.server_email.trim() !== '';
  const hasSenderName = config.sender_name && config.sender_name.trim() !== '';

  return Boolean(hasServerName && hasPort && hasServerEmail && hasSenderName);
}

export function resolveLoggedInUserEmail(userProfile) {
  if (userProfile && userProfile.email && userProfile.email.trim() !== '') {
    return userProfile.email.trim();
  }
  return null;
}

async function validateEmailServerConfig(dispatch, fetchEmailConfigs, showSnackbar) {
  try {
    const result = await dispatch(fetchEmailConfigs()).unwrap();

    if (!Array.isArray(result) || result.length === 0) {
      showSnackbar(EMAIL_SERVER_NOT_CONFIGURED_MESSAGE, 'error');
      return false;
    }

    const latestConfig = result[0];
    if (!isEmailServerConfigValid(latestConfig)) {
      showSnackbar(EMAIL_SERVER_NOT_CONFIGURED_MESSAGE, 'error');
      return false;
    }

    return true;
  } catch (error) {
    showSnackbar(EMAIL_SERVER_NOT_CONFIGURED_MESSAGE, 'error');
    return false;
  }
}

export async function validateEmailExport({
  dispatch,
  fetchEmailConfigs,
  userProfile,
  showSnackbar,
}) {
  const serverReady = await validateEmailServerConfig(dispatch, fetchEmailConfigs, showSnackbar);
  if (!serverReady) {
    return { ok: false };
  }

  const email = resolveLoggedInUserEmail(userProfile);
  if (!email) {
    showSnackbar(EMAIL_PROFILE_MISSING_MESSAGE, 'error');
    return { ok: false };
  }

  return { ok: true, email };
}

export async function invokeValidatedEmailExportAction({
  dispatch,
  fetchEmailConfigs,
  userProfile,
  showSnackbar,
  action,
}) {
  const result = await validateEmailExport({
    dispatch,
    fetchEmailConfigs,
    userProfile,
    showSnackbar,
  });

  if (!result.ok) {
    return result;
  }

  if (typeof action === 'function') {
    await action(result.email);
  }

  return result;
}

export async function openEmailExportDialog({
  dispatch,
  fetchEmailConfigs,
  userProfile,
  showSnackbar,
  action,
}) {
  await invokeValidatedEmailExportAction({
    dispatch,
    fetchEmailConfigs,
    userProfile,
    showSnackbar,
    action,
  });
}
