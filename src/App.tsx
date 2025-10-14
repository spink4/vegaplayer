/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, ImageBackground, View, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Link} from './components/Link';
import {PairScreen} from './pairScreen';

const images = {
  kepler: require('./assets/kepler.png'),
  learn: require('./assets/learn.png'),
  support: require('./assets/support.png'),
  build: require('./assets/build.png'),
};

export const App = () => {
  const [image, setImage] = useState(images.kepler);
  const [isPaired, setIsPaired] = useState(false);
  const [isCheckingPairing, setIsCheckingPairing] = useState(true);

  const styles = getStyles();

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

  // Original app content
  return (
    <ImageBackground
      source={require('./assets/background.png')}
      style={styles.background}>
      <View style={styles.container}>
        <View style={styles.links}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Hello Steve</Text>
            <Text style={styles.subHeaderText}>
              Select one of the options below to start your Kepler journey 🚀
            </Text>
          </View>


          <Link
            linkText={'Support'}
            onPress={() => {
              setImage(images.support);
            }}
          />
        </View>
        <View style={styles.image}>
          <Image source={image} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text}>
          💡 Edit App.tsx to change this screen and then come back to see your
          edits
        </Text>
      </View>
    </ImageBackground>
  );
};

const getStyles = () =>
  StyleSheet.create({
    background: {
      color: 'white',
      flex: 1,
      flexDirection: 'column',
    },
    container: {
      flex: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerContainer: {
      marginLeft: 200,
    },
    headerText: {
      color: 'white',
      fontSize: 80,
      marginBottom: 10,
    },
    subHeaderText: {
      color: 'white',
      fontSize: 40,
    },
    links: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-around',
      height: 600,
    },
    image: {
      flex: 1,
      paddingLeft: 150,
    },
    textContainer: {
      justifyContent: 'center',
      flex: 1,
      marginLeft: 190,
    },
    text: {
      color: 'white',
      fontSize: 40,
    },
  });
