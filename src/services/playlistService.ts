import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../apiService';
import {Playlist} from '../models/Playlist';
import {
  DEBUG,
  DEBUG_API_COMMS,
  DEBUG_FILE_DOWNLOADS,
  DEBUG_PLAYLIST_DOWNLOAD,
  MAX_FAILED_DOWNLOAD_COUNT,
  STATUS_DOWNLOAD_FAILED,
  STATUS_OK,
} from '../appGlobals';

/**
 * Playlist Service
 * Handles downloading playlists from the server and managing playlist state
 */

// Module-level state for playlist management
let currentPlaylist = new Playlist();
let nextPlaylist = new Playlist();
let newPlaylist = new Playlist();
let downloadPlaylistFilesCount = 0;
let isDownloadingFiles = false;
let pendingDownloadPlaylistFromServer = false;
let apiCommsTimer: NodeJS.Timeout | null = null;
let statusCode = STATUS_OK;

// Callbacks for playlist events
let onPlaylistChanged: ((playlist: Playlist) => void) | null = null;
let onPlaylistDownloadStarted: (() => void) | null = null;
let onPlaylistDownloadFailed: ((error: Error) => void) | null = null;

/**
 * Set callback for when playlist changes
 */
export const setOnPlaylistChanged = (callback: (playlist: Playlist) => void) => {
  onPlaylistChanged = callback;
};

/**
 * Set callback for when playlist download starts
 */
export const setOnPlaylistDownloadStarted = (callback: () => void) => {
  onPlaylistDownloadStarted = callback;
};

/**
 * Set callback for when playlist download fails
 */
export const setOnPlaylistDownloadFailed = (callback: (error: Error) => void) => {
  onPlaylistDownloadFailed = callback;
};

/**
 * Get the current playlist
 */
export const getCurrentPlaylist = (): Playlist => {
  return currentPlaylist;
};

/**
 * Get the current status code
 */
export const getStatusCode = (): string => {
  return statusCode;
};

/**
 * Download playlist from server
 * Checks for pair code first (screenId/screenToken), then downloads playlist
 */
export const downloadPlaylistFromServer = async (): Promise<void> => {
  try {
    if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
      console.log('[PlaylistService] downloadPlaylistFromServer - started');
    }

    // Check if we have pair code (screenId and screenToken)
    const screenId = await AsyncStorage.getItem('screenId');
    const screenToken = await AsyncStorage.getItem('screenToken');

    if (!screenId || !screenToken) {
      throw new Error('Screen not paired - missing screenId or screenToken');
    }

    if (DEBUG && DEBUG_API_COMMS) {
      console.log('[PlaylistService] Fetching playlist for screen:', screenId);
    }

    const response = await ApiService.getPlaylist(screenId, screenToken);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch playlist: ${response.status}`);
    }

    // We've got the playlist
    const downloadedPlaylist = new Playlist(response.data);

    if (DEBUG && DEBUG_API_COMMS) {
      console.log('[PlaylistService] Received playlist:', {
        itemCount: downloadedPlaylist.items.length,
        orientation: downloadedPlaylist.orientation,
        checkInterval: downloadedPlaylist.checkForUpdatesInterval,
      });
    }

    // Is it the same as last time?
    if (!downloadedPlaylist.equals(currentPlaylist)) {
      // New playlist found
      if (DEBUG && DEBUG_API_COMMS) {
        console.log('[PlaylistService] New playlist found');
      }

      // Download the media files needed for this playlist
      if (!isDownloadingFiles) {
        isDownloadingFiles = true;

        // Have we attempted to load this before?
        // We give up after a number of attempts
        if (newPlaylist && downloadedPlaylist.equals(newPlaylist)) {
          if (DEBUG && DEBUG_API_COMMS) {
            console.log(
              '[PlaylistService] Tried to download the files for this playlist last time',
            );
          }
          downloadPlaylistFilesCount++;
        } else {
          // Reset counter for new playlist
          downloadPlaylistFilesCount = 0;
        }

        // Check if we've exceeded max download attempts
        if (downloadPlaylistFilesCount >= MAX_FAILED_DOWNLOAD_COUNT) {
          throw new Error('Too many attempts to download files for this playlist');
        }

        newPlaylist = downloadedPlaylist;
        await downloadPlaylistFiles();

        // Notify that playlist is ready
        if (onPlaylistChanged) {
          onPlaylistChanged(nextPlaylist);
        }
      } else {
        if (DEBUG && DEBUG_API_COMMS) {
          console.log(
            '[PlaylistService] Already downloading files for playlist',
          );
        }
        pendingDownloadPlaylistFromServer = true; // Check for new playlist again when finished
      }
    } else {
      if (DEBUG && DEBUG_API_COMMS) {
        console.log('[PlaylistService] Playlist unchanged');
      }
    }
  } catch (error) {
    isDownloadingFiles = false;
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error('[PlaylistService] Error:', errorMessage);

    if (onPlaylistDownloadFailed) {
      onPlaylistDownloadFailed(
        error instanceof Error ? error : new Error(errorMessage),
      );
    }
  }

  // Set a timer for the next check
  const checkInterval = currentPlaylist?.checkForUpdatesInterval || 320;
  if (apiCommsTimer) {
    clearTimeout(apiCommsTimer);
  }
  apiCommsTimer = setTimeout(
    downloadPlaylistFromServer,
    checkInterval * 1000,
  );

  if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
    console.log(
      `[PlaylistService] Next playlist check in ${checkInterval} seconds`,
    );
  }
};

/**
 * Function to download the files needed for a playlist
 * Currently a stub - will be implemented when we add file download support
 */
async function downloadPlaylistFiles(): Promise<void> {
  if (DEBUG && DEBUG_FILE_DOWNLOADS) {
    console.log('[PlaylistService] downloadPlaylistFiles - started');
  }

  try {
    // TODO: Implement file downloading logic
    // For now, we'll just mark the playlist as ready since we're not downloading files yet
    if (DEBUG && DEBUG_FILE_DOWNLOADS) {
      console.log('[PlaylistService] File downloading not yet implemented');
      console.log('[PlaylistService] Playlist has', newPlaylist.items.length, 'items');
    }

    // Simulate success - in future this will download actual files
    // For each item in the playlist, we would:
    // 1. Check if file already exists locally
    // 2. Download if needed
    // 3. Verify download succeeded

    // Mark the playlist as ready
    nextPlaylist = newPlaylist;
    downloadPlaylistFilesCount = 0; // Reset counter

    // Save to AsyncStorage
    await nextPlaylist.savePlaylistToAsyncStorage();

    statusCode = STATUS_OK;
    isDownloadingFiles = false;

    // Update current playlist
    currentPlaylist = nextPlaylist;

    if (DEBUG && DEBUG_FILE_DOWNLOADS) {
      console.log('[PlaylistService] Playlist ready for display');
    }

    // Check if we have a pending download request
    if (pendingDownloadPlaylistFromServer) {
      if (apiCommsTimer) {
        clearTimeout(apiCommsTimer);
      }
      apiCommsTimer = setTimeout(downloadPlaylistFromServer, 2000);
      pendingDownloadPlaylistFromServer = false;
    }
  } catch (err) {
    if (DEBUG) {
      console.log('[PlaylistService] downloadPlaylistFiles - failed');
      if (err) {
        console.log(err);
      }
    }

    statusCode = STATUS_DOWNLOAD_FAILED;
    isDownloadingFiles = false;
  }
}

/**
 * Stop the playlist service and clear timers
 */
export const stopPlaylistService = (): void => {
  if (apiCommsTimer) {
    clearTimeout(apiCommsTimer);
    apiCommsTimer = null;
  }
  if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
    console.log('[PlaylistService] Stopped');
  }
};

/**
 * Initialize the playlist service
 * Loads any saved playlist from AsyncStorage and starts downloading updates
 */
export const initializePlaylistService = async (): Promise<void> => {
  if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
    console.log('[PlaylistService] Initializing...');
  }

  try {
    // Try to load saved playlist from AsyncStorage
    await currentPlaylist.retrievePlaylistFromAsyncStorage();
    currentPlaylist.initialize();

    if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
      console.log('[PlaylistService] Loaded playlist from storage:', {
        itemCount: currentPlaylist.items.length,
      });
    }
  } catch (error) {
    if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
      console.log('[PlaylistService] No saved playlist found or error loading it');
    }
  }

  // Start downloading playlist from server
  // Use a small delay to let things settle
  setTimeout(() => {
    downloadPlaylistFromServer();
  }, 2500);
};
