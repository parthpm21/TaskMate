/**
 * tokenStore.js
 * Holds a reference to Clerk's getToken function so the Axios interceptor
 * (which runs outside of React's component tree) can fetch fresh JWTs.
 *
 * Usage:
 *   - AuthContext calls setTokenGetter(getToken) on mount
 *   - api.js calls getClerkToken() in its request interceptor
 */
let _getToken = null;

export const setTokenGetter = (fn) => {
  _getToken = fn;
};

export const getClerkToken = () => _getToken?.();
