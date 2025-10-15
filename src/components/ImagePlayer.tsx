/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import * as FileSystem from '@amazon-devices/expo-file-system';
import {PlaylistItem} from '../models/PlaylistItem';
import {DEBUG} from '../appGlobals';

interface ImagePlayerProps {
  item: PlaylistItem;
  fitToScreen: string;
}

export const ImagePlayer: React.FC<ImagePlayerProps> = ({item, fitToScreen}) => {
  if (!item || !item.filename) {
    return null;
  }

  const localPath = `${FileSystem.documentDirectory}${item.filename}`;
  // Ensure proper file:// URI format
  const localUri = localPath.startsWith('file://')
    ? localPath
    : `file://${localPath}`;
  const resizeMode = fitToScreen === 'FitXY' ? 'contain' : 'cover';

  if (DEBUG) {
    console.log('[ImagePlayer] Displaying image:', {
      filename: item.filename,
      localPath,
      localUri,
      resizeMode,
    });
  }

  const handleError = (error: any) => {
    console.error('[ImagePlayer] Error loading image:', {
      filename: item.filename,
      uri: localUri,
      error,
    });
  };

  const handleLoad = () => {
    if (DEBUG) {
      console.log('[ImagePlayer] Image loaded successfully:', item.filename);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{uri: localUri}}
        style={styles.image}
        resizeMode={resizeMode}
        onError={handleError}
        onLoad={handleLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
