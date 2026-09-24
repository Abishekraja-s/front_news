export const MATRIMONY_LOGIN_MESSAGE = 'Please login to view this profile.';

/** Build login redirect preserving the profile URL the user tried to open. */
export const matrimonyLoginRedirect = (profilePath) => ({
  pathname: '/matrimony/login',
  state: {
    from: profilePath,
    message: MATRIMONY_LOGIN_MESSAGE,
  },
});

export const resolvePostLoginPath = (from, fallback = '/matrimony/member') => {
  if (!from) return fallback;
  if (typeof from === 'string') return from;
  if (from.pathname) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
  }
  return fallback;
};
