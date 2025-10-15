/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {Playlist} from '../models/Playlist';
import {PlaylistItem} from '../models/PlaylistItem';
import {ImagePlayer} from './ImagePlayer';
import {VideoPlayer} from './VideoPlayer';
import {DEBUG} from '../appGlobals';

interface PlaylistRunnerProps {
  playlist: Playlist;
}

export const PlaylistRunner: React.FC<PlaylistRunnerProps> = ({playlist}) => {
  const [currentItem, setCurrentItem] = useState<PlaylistItem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [videoPlayInProgress, setVideoPlayInProgress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize playlist on mount or when playlist changes
  useEffect(() => {
    if (playlist && playlist.hasItemsToDisplay()) {
      if (DEBUG) {
        console.log('[PlaylistRunner] Initializing playlist');
      }
      playlist.initialize();
      setIsInitialized(true);
      startPlaylistRunner();
    } else {
      if (DEBUG) {
        console.log('[PlaylistRunner] No items to display');
      }
      setIsInitialized(false);
      setCurrentItem(null);
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist]);

  const startPlaylistRunner = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (DEBUG) {
      console.log('[PlaylistRunner] Starting playlist runner');
    }

    displayNextItem();
  };

  const displayNextItem = () => {
    if (!playlist || !playlist.hasItemsToDisplay()) {
      if (DEBUG) {
        console.log('[PlaylistRunner] No items to display');
      }
      return;
    }

    const item = playlist.getCurrentPlaylistItem();

    if (!item) {
      if (DEBUG) {
        console.log('[PlaylistRunner] No current item found');
      }
      return;
    }

    if (DEBUG) {
      console.log('[PlaylistRunner] Displaying item:', {
        filename: item.filename,
        fileType: item.fileType,
        displayDuration: item.displayDuration,
      });
    }

    // Handle images
    if (item.fileType === 'Image') {
      setCurrentItem(item);

      // Schedule next item
      const duration = item.displayDuration * 1000; // Convert to milliseconds
      timerRef.current = setTimeout(() => {
        // Move to next item
        playlist.incrementCurPos();
        displayNextItem();
      }, duration);
    } else if (item.fileType === 'Video') {
      // Handle videos
      if (DEBUG) {
        console.log('[PlaylistRunner] Playing video:', item.filename);
      }
      setVideoPlayInProgress(true);
      setCurrentItem(item);
      // Video component will call handleVideoEnded when playback completes
    } else {
      if (DEBUG) {
        console.log(
          `[PlaylistRunner] Skipping unsupported item: ${item.fileType}`,
        );
      }
      // Skip unsupported items
      playlist.incrementCurPos();
      displayNextItem();
    }
  };

  const getItemFitToScreen = (item: PlaylistItem): string => {
    // Use item-specific fit setting if available, otherwise use playlist default
    // For now, just use playlist default
    return playlist.fitItem || 'FitXY';
  };

  const handleVideoEnded = () => {
    if (DEBUG) {
      console.log('[PlaylistRunner] Video ended callback');
    }
    if (videoPlayInProgress) {
      setVideoPlayInProgress(false);
      // Move to next item
      playlist.incrementCurPos();
      displayNextItem();
    }
  };

  const handleVideoError = (error: any) => {
    console.error('[PlaylistRunner] Video error callback:', error);
    if (videoPlayInProgress) {
      setVideoPlayInProgress(false);
      // Skip to next item on error
      playlist.incrementCurPos();
      displayNextItem();
    }
  };

  // Show blank screen if not initialized or no current item
  if (!isInitialized || !currentItem) {
    return (
      <View style={styles.container}>
        {DEBUG && (
          <Text style={styles.debugText}>
            {!isInitialized
              ? 'Waiting for playlist...'
              : 'Loading first item...'}
          </Text>
        )}
      </View>
    );
  }

  // Display current item based on type
  if (currentItem.fileType === 'Image') {
    return (
      <ImagePlayer
        item={currentItem}
        fitToScreen={getItemFitToScreen(currentItem)}
      />
    );
  }

  if (currentItem.fileType === 'Video') {
    return (
      <VideoPlayer
        item={currentItem}
        fitToScreen={getItemFitToScreen(currentItem)}
        onVideoEnded={handleVideoEnded}
        onVideoError={handleVideoError}
      />
    );
  }

  // Fallback for unsupported types
  return (
    <View style={styles.container}>
      {DEBUG && (
        <Text style={styles.debugText}>
          Unsupported item type: {currentItem.fileType}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  debugText: {
    color: '#ffffff',
    fontSize: 12,
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
});
