//export const BASE_URL = "http://localhost:8080/api";
export const BASE_URL = "https://api.ablesign.tv/api";

export const MQTT_SERVER_HOST = "wss://mq.ablesign.tv";

export const DEBUG = true;
export const DEBUG_TRANSITIONS = false;
export const DEBUG_FILE_DOWNLOADS = true;
export const DEBUG_API_COMMS = true;
export const DEBUG_CALLBACKS = false;
export const DEBUG_PLAYLIST_RUNNER = false;
export const DEBUG_PAIRING = true;
export const DEBUG_CACHE = true;

export const MAX_FAILED_DOWNLOAD_COUNT = 3; // give up downloading a file after this many attempts

export const AXIOS_DEFAULT_TIMEOUT = 7000; // global default for all api calls
export const RETRY_API_CONNECTION_TIME = 10000; // if failed to connect to the API at startup
export const RETRY_SCREEN_PAIRING_ROUTINE = 3000; // how often to check if screen has been paired by user

// initial device boot up delays (to let things settle!)
export const STARTUP_DELAY_SEND_SCREEN_STATUS = 1500;
export const STARTUP_DELAY_DOWNLOAD_PLAYLIST = 2500;

// how long to wait for a native video to start playing before giving up
export const WAIT_FOR_NATIVE_VIDEO_TO_START_TIME = 5000;

export const STORAGE_PATH = "storage/sd/ablesign-content/";
export const HTML_ACCESS_PATH = "file://sd/ablesign-content/";

export const SOFTWARE_VERSION_CODE = "34";
export const SOFTWARE_VERSION_NAME = "2.3.3";

// status codes
export const STATUS_DOWNLOAD_FAILED = "download_failed";
export const STATUS_OK = "ok";
export const STATUS_STORAGE_FULL = "storage_full";
export const STATUS_DOWNLOAD_ABORTED = "download_aborted";
