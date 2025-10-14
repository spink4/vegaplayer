import http from './apiCommon';
import {DEBUG, DEBUG_API_COMMS} from './appGlobals';

const screenHeader = (screenToken: string): Record<string, string> => {
  const headers = {
    'x-access-token': screenToken,
  };

  if (DEBUG && DEBUG_API_COMMS) {
    console.log('[ApiService] Creating auth header with token:', screenToken);
  }

  return headers;
};

const getRegistrationCode = () => {
  return http.get(`/screens/registration?platformType=mobile`);
};

const checkRegistration = (code: string) => {
  return http.get(`/screens/registration/${code}`);
};

const getPlaylist = (screenId: string, screenToken: string) => {
  return http.get(`/screens/${screenId}/screen_playlist`, {
    headers: screenHeader(screenToken),
  });
};

const sendScreenStatusToServer = (
  screenId: string,
  data: any,
  screenToken: string,
) => {
  return http.post(`/screens/${screenId}/status`, data, {
    headers: screenHeader(screenToken),
  });
};

const getPreviewScreenPlaylist = (token: string) => {
  return http.post(`/previewScreenTokens/preview`, {token});
};

const ApiService = {
  getRegistrationCode,
  checkRegistration,
  getPlaylist,
  sendScreenStatusToServer,
  getPreviewScreenPlaylist,
};

export default ApiService;
