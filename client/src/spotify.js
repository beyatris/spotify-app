import axios from 'axios';

const LOCALSTORAGE_KEYS = {
   accessToken: 'spotify_access_token',
   refreshToken: 'spotify_refresh_token',
   expireTime: 'spotify_token_expire_time',
   timestamp: 'spotify_token_timestamp',
 }
 
const LOCALSTORAGE_VALUES = {
   accessToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.accessToken),
   refreshToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.refreshToken),
   expireTime: window.localStorage.getItem(LOCALSTORAGE_KEYS.expireTime),
   timestamp: window.localStorage.getItem(LOCALSTORAGE_KEYS.timestamp),
 };

const getAccessToken = () => {
   const queryString = window.location.search;
   const urlParams = new URLSearchParams(queryString);
   const queryParams = {
      [LOCALSTORAGE_KEYS.accessToken]: urlParams.get('access_token'),
      [LOCALSTORAGE_KEYS.refreshToken]: urlParams.get('refresh_token'),
      [LOCALSTORAGE_KEYS.expireTime]: urlParams.get('expires_in'),
   };
   const hasError = urlParams.get('error');

   // If there is an error or token in localStorage has expired, refresh token
   if (hasError || hasTokenExpired() || LOCALSTORAGE_VALUES.accessToken === 'undefined') {
      refreshToken();
   }

   // If token in localStorage is valid, use that
   if (LOCALSTORAGE_VALUES.accessToken && LOCALSTORAGE_VALUES.accessToken !== 'undefined') {
      return LOCALSTORAGE_VALUES.accessToken;
   }

   // If there is token in the URL query params, user is logging in for the first time
   if (queryParams[LOCALSTORAGE_KEYS.accessToken]) {
      // Store in localStorage
      for (const property in queryParams) {
         window.localStorage.setItem(property, queryParams[property]);
      }
      window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());
      return queryParams[LOCALSTORAGE_KEYS.accessToken];
   }

   return false;
};

const hasTokenExpired = () => {
   const { accessToken, timestamp, expireTime } = LOCALSTORAGE_VALUES;
   if (!accessToken || !timestamp) {
      return false;
   }
   const millisecondsElapsed = Date.now() - Number(timestamp);
   return (millisecondsElapsed / 1000) > Number(expireTime); 
};

const refreshToken = async () => {
   try {
      // Logout if there is no refresh token stored
      if (!LOCALSTORAGE_VALUES.refreshToken ||
         LOCALSTORAGE_VALUES.refreshToken === 'undefined' ||
         (Date.now() - Number(LOCALSTORAGE_VALUES.timestamp) / 1000) < 1000
      ) {
         console.error('No refresh token available');
         logout();
      }

      // Use `/refresh_token` endpoint from Node app
      const { data } = await axios.get(`/refresh_token?refresh_token=${LOCALSTORAGE_VALUES.refreshToken}`)

      // Update localStorage values
      window.localStorage.setItem(LOCALSTORAGE_KEYS.accessToken, data.accessToken);
      window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());

      // Reload the page for updates to be reflected
      window.location.reload();
   } catch (e) {
      console.error(e);
   }
};

export const accessToken = getAccessToken();

export const logout = () => {
   // Clear localStorage items
   for (const property in LOCALSTORAGE_KEYS) {
      window.localStorage.removeItem(LOCALSTORAGE_KEYS[property]);
   }
   // Navigate to homepage
   window.location = window.location.origin;
}