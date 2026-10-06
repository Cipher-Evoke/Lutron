import { isAuthTokenError } from '../authErrorDetection';

describe('isAuthTokenError', () => {
  it('returns true for HTTP 401', () => {
    expect(isAuthTokenError({ status: 401 })).toBe(true);
  });

  it('returns false for HTTP 403 (floor permission denied)', () => {
    expect(
      isAuthTokenError({
        status: 403,
        apiMessage: 'Forbidden',
        message: 'Request failed with status code 403',
      })
    ).toBe(false);
  });

  it('returns false for generic floor plan load failures', () => {
    expect(
      isAuthTokenError({
        status: 403,
        apiMessage: 'You do not have permission to access this floor',
      })
    ).toBe(false);
  });

  it('returns true for missing client token messages', () => {
    expect(
      isAuthTokenError({ message: 'No valid authentication token' })
    ).toBe(true);
  });

  it('returns true for interceptor auth failure message', () => {
    expect(
      isAuthTokenError({ message: 'Authentication failure - redirecting to login' })
    ).toBe(true);
  });

  it('does not treat unrelated errors as auth failures', () => {
    expect(
      isAuthTokenError({
        status: 500,
        message: 'Network Error',
        apiMessage: 'Internal server error',
      })
    ).toBe(false);
  });
});
