import API from './api';

/**
 * Investor sends a "Connect" request to an entrepreneur for a specific pitch.
 */
export const sendConnectionRequest = async (pitchId: number) => {
  const response = await API.post('auth/connections/', { pitch: pitchId });
  return response.data;
};

/**
 * Fetches connection requests relevant to the logged-in user.
 * Investors see requests they sent; entrepreneurs see requests they received.
 */
export const fetchConnections = async () => {
  const response = await API.get('auth/connections/');
  // Backend uses pagination, so the real list is inside `results`
  return response.data.results ?? response.data;
};

/**
 * Entrepreneur accepts a pending connection request.
 */
export const acceptConnection = async (connectionId: number) => {
  const response = await API.post(`auth/connections/${connectionId}/accept/`);
  return response.data;
};

/**
 * Entrepreneur rejects a pending connection request.
 */
export const rejectConnection = async (connectionId: number) => {
  const response = await API.post(`auth/connections/${connectionId}/reject/`);
  return response.data;
};