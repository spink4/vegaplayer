/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {
  VideoPlayer as VegaVideoPlayer,
  KeplerVideoView,
} from '@amazon-devices/react-native-w3cmedia';
import * as FileSystem from '@amazon-devices/expo-file-system';
import {PlaylistItem} from '../models/PlaylistItem';
import {DEBUG} from '../appGlobals';

interface VideoPlayerProps {
  item: PlaylistItem;
  fitToScreen: string;
  onVideoEnded: () => void;
  onVideoError: (error: any) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  item,
  fitToScreen,
  onVideoEnded,
  onVideoError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoPlayerRef = useRef<VegaVideoPlayer | null>(null);

  useEffect(() => {
    if (!item || !item.filename) {
      return;
    }

    const initializeVideo = async () => {
      try {
        if (DEBUG) {
          console.log('[VideoPlayer] Initializing video player for:', item.filename);
        }

        // Create video player instance
        const player = new VegaVideoPlayer();
        await player.initialize();

        // Set up event listeners
        player.addEventListener('play', () => {
          if (DEBUG) {
            console.log('[VideoPlayer] Video play event');
          }
          setIsPlaying(true);
        });

        player.addEventListener('playing', () => {
          if (DEBUG) {
            console.log('[VideoPlayer] Video playing event');
          }
        });

        player.addEventListener('ended', () => {
          if (DEBUG) {
            console.log('[VideoPlayer] Video ended:', item.filename);
          }
          setIsPlaying(false);
          onVideoEnded();
        });

        player.addEventListener('error', (err: any) => {
          const errorMessage = err?.message || 'Video playback error';
          console.error('[VideoPlayer] Video error:', {
            filename: item.filename,
            error: errorMessage,
          });
          setError(errorMessage);
          setIsPlaying(false);
          onVideoError(err);
        });

        player.addEventListener('loadedmetadata', () => {
          if (DEBUG) {
            console.log('[VideoPlayer] Video loaded successfully:', item.filename);
          }
        });

        player.addEventListener('pause', () => {
          if (DEBUG) {
            console.log('[VideoPlayer] Video paused');
          }
          setIsPlaying(false);
        });

        // Set video source and play
        const localPath = `${FileSystem.documentDirectory}${item.filename}`;
        const localUri = localPath.startsWith('file://')
          ? localPath
          : `file://${localPath}`;

        if (DEBUG) {
          console.log('[VideoPlayer] FileSystem.documentDirectory:', FileSystem.documentDirectory);
          console.log('[VideoPlayer] item.filename:', item.filename);
          console.log('[VideoPlayer] localPath:', localPath);
          console.log('[VideoPlayer] Video URI:', localUri);
          console.log('[VideoPlayer] Checking if file exists...');
        }

        // Check if file exists (try without file:// prefix first)
        try {
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (DEBUG) {
            console.log('[VideoPlayer] File info (checking localPath):', fileInfo);
          }
          if (!fileInfo.exists) {
            throw new Error(`Video file not found: ${item.filename}`);
          }
        } catch (fileErr) {
          console.error('[VideoPlayer] Error checking file:', fileErr);
          throw new Error(`Cannot access video file: ${item.filename}`);
        }

        player.src = localUri;
        videoPlayerRef.current = player;
        setIsInitialized(true);

        if (DEBUG) {
          console.log('[VideoPlayer] Starting playback...');
        }

        // Start playback
        try {
          await player.play();
          if (DEBUG) {
            console.log('[VideoPlayer] Play command successful');
          }
        } catch (playErr) {
          console.error('[VideoPlayer] Error calling play():', playErr);
          // Don't throw - let the error event handler deal with it
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[VideoPlayer] Error initializing video:', errorMessage);
        setError(errorMessage);
        onVideoError(err);
      }
    };

    initializeVideo();

    // Cleanup
    return () => {
      if (DEBUG) {
        console.log('[VideoPlayer] Cleaning up video player');
      }

      if (videoPlayerRef.current) {
        videoPlayerRef.current.pause();
        videoPlayerRef.current.deinitialize().catch((err: any) => {
          console.error('[VideoPlayer] Error deinitializing:', err);
        });
        videoPlayerRef.current = null;
      }

      setIsInitialized(false);
      setIsPlaying(false);
      setError(null);
    };
  }, [item]);

  if (!item || !item.filename) {
    return null;
  }

  if (error) {
    return (
      <View style={styles.container}>
        {DEBUG && (
          <Text style={styles.errorText}>
            Error loading video: {item.filename}
            {'\n'}
            {error}
          </Text>
        )}
      </View>
    );
  }

  if (!isInitialized || !videoPlayerRef.current) {
    return (
      <View style={styles.container}>
        {DEBUG && (
          <Text style={styles.debugText}>
            Initializing video: {item.filename}
          </Text>
        )}
      </View>
    );
  }

  // Map fitToScreen to scalingmode
  // FitXY = contain = 'fit'
  // otherwise = cover = 'fill'
  const scalingmode = fitToScreen === 'FitXY' ? 'fit' : 'fill';

  return (
    <View style={styles.container}>
      <KeplerVideoView
        videoPlayer={videoPlayerRef.current}
        style={styles.video}
        scalingmode={scalingmode}
        showControls={false}
        showCaptions={false}
      />
      {DEBUG && (
        <Text style={styles.debugText}>
          {isPlaying ? 'Playing: ' : 'Loading: '}
          {item.filename}
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
  video: {
    width: '100%',
    height: '100%',
  },
  debugText: {
    color: '#ffffff',
    fontSize: 12,
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    textAlign: 'center',
  },
});
