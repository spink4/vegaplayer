/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PairScreen} from './pairScreen';
import {Playlist} from './models/Playlist';
import {
  initializePlaylistService,
  stopPlaylistService,
  setOnPlaylistChanged,
} from './services/playlistService';
import {DEBUG, DEBUG_PLAYLIST_DOWNLOAD} from './appGlobals';

export const App = () => {
  const [isPaired, setIsPaired] = useState(false);
  const [isCheckingPairing, setIsCheckingPairing] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);

  // TEMPORARY: Function to clear all AsyncStorage
  const clearAllStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('[App] ✅ All AsyncStorage cleared!');
    } catch (error) {
      console.error('[App] Error clearing storage:', error);
    }
  };

  // Check if screen is already paired on mount
  useEffect(() => {
    // TEMPORARY: Uncomment the line below to clear all storage and start fresh
    // clearAllStorage();

    checkIfAlreadyPaired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize playlist service when paired
  useEffect(() => {
    if (isPaired) {
      if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
        console.log('[App] Screen is paired, initializing playlist service...');
      }

      // Set up playlist change callback
      setOnPlaylistChanged((playlist: Playlist) => {
        if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
          console.log('[App] Playlist changed, updating state');
        }
        setCurrentPlaylist(playlist);
      });

      // Initialize the playlist service
      initializePlaylistService();

      // Cleanup on unmount
      return () => {
        if (DEBUG && DEBUG_PLAYLIST_DOWNLOAD) {
          console.log('[App] Cleaning up playlist service');
        }
        stopPlaylistService();
      };
    }
  }, [isPaired]);

  const checkIfAlreadyPaired = async () => {
    try {
      const screenToken = await AsyncStorage.getItem('screenToken');
      setIsPaired(!!screenToken);
    } catch (error) {
      console.log('Error checking pairing status:', error);
      setIsPaired(false);
    } finally {
      setIsCheckingPairing(false);
    }
  };

  const handlePairingComplete = () => {
    setIsPaired(true);
  };

  // Show pair screen if not paired
  if (isCheckingPairing) {
    return <View style={{flex: 1, backgroundColor: '#a7458e'}} />;
  }
 
  if (!isPaired) {
    return <PairScreen onPaired={handlePairingComplete} />;
  }

  // Show blank black screen when paired
  // In the future, this will display the actual playlist content
  return (
    <View style={styles.pairedScreen}>
      {DEBUG && currentPlaylist && (
        <Text style={styles.debugText}>
          Playlist loaded: {currentPlaylist.items.length} items
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pairedScreen: {
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
