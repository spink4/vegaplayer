import http from './apiCommon';

interface ScreenHeader {
  Authorization: string;
}

const screenHeader = (screenToken: string): ScreenHeader => {
  return {
    Authorization: `Bearer ${screenToken}`,
  };
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
