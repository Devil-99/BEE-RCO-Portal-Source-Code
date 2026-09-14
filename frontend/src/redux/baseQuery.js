import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setSessionMeta } from './sessionSlice';

const localhost = 'http://127.0.0.1:8000/v1/';
const host = process.env.NODE_ENV === 'development' ? localhost : `${window.location.origin}/v1/`

const rawBaseQuery = fetchBaseQuery({
  baseUrl: host,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState();

    const token = state.login?.session_token;
    const session_id = state.login?.session_id;

    if (token) {
      headers.set('Session-Token', token);
    }

    if (session_id) {
      headers.set('Session-Id', session_id);
    }

    return headers;
  },
});

const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
  const headers = result.meta?.response?.headers;
  const lastActivity = headers?.get('X-Session-Last-Activity');
  const expiresAt = headers?.get('X-Session-Expires-At');

  if (lastActivity || expiresAt) {
    api.dispatch(setSessionMeta({
      lastActivity,
      expiresAt
    }));
  }

  return result;
};

export { host };
export default baseQuery;
