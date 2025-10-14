import React, {useEffect, useState, useRef} from 'react';
import {StyleSheet, Text, View, ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './apiService';
import {
  DEBUG,
  DEBUG_PAIRING,
  RETRY_SCREEN_PAIRING_ROUTINE,
  RETRY_API_CONNECTION_TIME,
} from './appGlobals';
import {
  STRING_REGISTER_SCREEN_STARTUP_MESSAGE,
  STRING_REGISTER_SCREEN_MESSAGE,
  STRING_REGISTER_SCREEN_NO_INTERNET_MESSAGE,
} from './strings';
import {sleep} from './playerUtils';

interface PairScreenProps {
  onPaired?: () => void;
}

/**
 * PairScreen component - displays pairing code and handles screen registration
 */
export const PairScreen: React.FC<PairScreenProps> = ({onPaired}) => {
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string>(
    STRING_REGISTER_SCREEN_STARTUP_MESSAGE,
  );
  const [isRetryingConnection, setIsRetryingConnection] = useState(false);
  const checkPairCodeTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Get screen registration code from the AbleSign API
   */
  const getRegistrationCode = async (): Promise<string> => {
    if (DEBUG && DEBUG_PAIRING) {
      console.log('[PairScreen] Fetching registration code...');
    }

    const response = await ApiService.getRegistrationCode();

    if (DEBUG && DEBUG_PAIRING) {
      console.log('[PairScreen] Registration response:', response);
    }

    if (response.status !== 200) {
      throw new Error(`Failed to fetch registration code: ${response.status}`);
    }

    return response.data.code;
  };

  /**
   * Check if user has paired the screen using AbleSign API
   */
  const checkIfScreenRegistered = async (code: string) => {
    try {
      if (DEBUG && DEBUG_PAIRING) {
        console.log('[PairScreen] Checking if screen is registered with code:', code);
      }

      const response = await ApiService.checkRegistration(code);

      if (response.data.token) {
        // Screen has been paired!
        if (DEBUG && DEBUG_PAIRING) {
          console.log('[PairScreen] Screen has been paired! Saving credentials...');
        }

        // Clear any pending timers FIRST
        if (checkPairCodeTimer.current) {
          clearTimeout(checkPairCodeTimer.current);
          checkPairCodeTimer.current = null;
        }

        // Store credentials in AsyncStorage (equivalent to localStorage)
        // AsyncStorage requires strings, so convert screenId to string
        await AsyncStorage.setItem('screenId', String(response.data.screenId));
        await AsyncStorage.setItem('screenToken', response.data.token);

        if (DEBUG && DEBUG_PAIRING) {
          console.log('[PairScreen] Credentials saved. Notifying parent...');
        }

        // Notify parent component that pairing is complete
        if (onPaired) {
          onPaired();
        }

        return; // Exit early, don't schedule any more checks
      } else {
        // Not paired yet, check again in 3 seconds
        if (DEBUG && DEBUG_PAIRING) {
          console.log('[PairScreen] Not paired yet, will check again in 3s');
        }
        checkPairCodeTimer.current = setTimeout(
          () => checkIfScreenRegistered(code),
          RETRY_SCREEN_PAIRING_ROUTINE,
        );
      }
    } catch (e) {
      if (DEBUG && DEBUG_PAIRING) {
        console.error('[PairScreen] Error checking registration:', e);
      }
      // Continue checking even on error - retry in 3 seconds
      checkPairCodeTimer.current = setTimeout(
        () => checkIfScreenRegistered(code),
        RETRY_SCREEN_PAIRING_ROUTINE,
      );
    }
  };

  /**
   * Display the screen pairing code on the page
   */
  const displayPairingCode = async () => {
    try {
      if (DEBUG && DEBUG_PAIRING) {
        console.log('[PairScreen] displayPairingCode called');
      }

      if (isRetryingConnection) {
        if (DEBUG && DEBUG_PAIRING) {
          console.log('[PairScreen] Retrying connection, waiting 3s...');
        }
        await sleep(3000);
      }

      const code = await getRegistrationCode();

      if (DEBUG && DEBUG_PAIRING) {
        console.log('[PairScreen] Got pairing code:', code);
        console.log('[PairScreen] Setting message to:', STRING_REGISTER_SCREEN_MESSAGE);
      }

      // Reset retry flag and update UI
      setIsRetryingConnection(false);
      setPairCode(code);
      setMessage(STRING_REGISTER_SCREEN_MESSAGE);

      // Start checking if screen has been registered
      if (DEBUG && DEBUG_PAIRING) {
        console.log('[PairScreen] Starting registration check timer');
      }

      checkPairCodeTimer.current = setTimeout(
        () => checkIfScreenRegistered(code),
        RETRY_SCREEN_PAIRING_ROUTINE,
      );
    } catch (err) {
      console.error('[PairScreen] ERROR displaying pairing code:', err);

      if (err instanceof Error) {
        console.error('[PairScreen] Error name:', err.name);
        console.error('[PairScreen] Error message:', err.message);
      }

      // Clear pair code and show error message
      setPairCode(null);
      setMessage(STRING_REGISTER_SCREEN_NO_INTERNET_MESSAGE);
      setIsRetryingConnection(true);

      if (DEBUG && DEBUG_PAIRING) {
        console.log('[PairScreen] Setting error message to:', STRING_REGISTER_SCREEN_NO_INTERNET_MESSAGE);
        console.log('[PairScreen] Will retry in 10s...');
      }

      setTimeout(displayPairingCode, RETRY_API_CONNECTION_TIME);
    }
  };

  // Initialize pairing process on mount
  useEffect(() => {
    if (DEBUG && DEBUG_PAIRING) {
      console.log('[PairScreen] Component mounted, initializing...');
    }

    displayPairingCode();

    // Cleanup timers on unmount
    return () => {
      if (DEBUG && DEBUG_PAIRING) {
        console.log('[PairScreen] Component unmounting, cleaning up timers');
      }
      if (checkPairCodeTimer.current) {
        clearTimeout(checkPairCodeTimer.current);
      }
    };
  }, []);

  if (DEBUG && DEBUG_PAIRING) {
    console.log('[PairScreen] Rendering with pairCode:', pairCode, 'message:', message);
  }

  return (
    <View style={styles.container}>
      <View style={styles.pairCodeContainer}>
        {pairCode ? (
          <Text style={styles.pairCodeText1}>{pairCode}</Text>
        ) : (
          <ActivityIndicator size="large" color="#ffffff" />
        )}
        <Text style={styles.pairCodeText2}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7458e', // Pink background matching webplayer
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairCodeText1: {
    fontSize: 120,
    fontWeight: '400', // Normal weight like webplayer
    fontFamily: 'Roboto',
    color: '#ffffff', // White text
    marginBottom: 70,
    letterSpacing: 5,
  },
  pairCodeText2: {
    fontSize: 40,
    fontWeight: '400',
    fontFamily: 'Roboto',
    color: '#ffffff', // White text
    textAlign: 'center',
    lineHeight: 60,
    paddingHorizontal: 100,
  },
});
