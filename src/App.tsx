/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import React, {useState, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PairScreen} from './pairScreen';

export const App = () => {
  const [isPaired, setIsPaired] = useState(false);
  const [isCheckingPairing, setIsCheckingPairing] = useState(true);



  // Check if screen is already paired on mount
  useEffect(() => {
    checkIfAlreadyPaired();
  }, []);

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
  return <View style={styles.pairedScreen} />;
};

const styles = StyleSheet.create({
  pairedScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
