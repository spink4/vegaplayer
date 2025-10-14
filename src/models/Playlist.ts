import AsyncStorage from '@react-native-async-storage/async-storage';
import {PlaylistItem} from './PlaylistItem';
import {DEBUG, DEBUG_API_COMMS} from '../appGlobals';

interface PlaylistJson {
  mode?: string;
  items?: any[];
  orientation?: string;
  fitItem?: string;
  fitItemOpposing?: string;
  checkForUpdatesInterval?: number;
  gapless?: boolean;
  shufflePlay?: boolean;
  enableImageTransitions?: boolean;
  enableWebappTransitions?: boolean;
  defaultTransition?: string;
  defaultTransitionSpeed?: number;
}

/**
 * Class to hold a playlist and its settings
 */
export class Playlist {
  mode: string;
  items: PlaylistItem[];
  orientation: string;
  fitItem: string;
  fitItemOpposing: string;
  checkForUpdatesInterval: number;
  gapless: boolean;
  shufflePlay: boolean;
  enableImageTransitions: boolean;
  enableWebappTransitions: boolean;
  activeIndexes: number[];
  curPos: number;
  curPosHolder: number;
  nextPosHolder: number;
  prevIndex: number;
  defaultTransition?: string;
  defaultTransitionSpeed?: number;

  constructor(json: PlaylistJson = {}) {
    this.mode = 'active';
    this.items = [];
    this.orientation = 'landscape';
    this.fitItem = 'FitXY';
    this.fitItemOpposing = 'FitXY';
    this.checkForUpdatesInterval = 60;
    this.gapless = false;
    this.shufflePlay = false;
    this.enableImageTransitions = true;
    this.enableWebappTransitions = false;
    this.activeIndexes = [];
    this.curPos = 0;
    this.curPosHolder = 0;
    this.nextPosHolder = 0;
    this.prevIndex = -1;
    this.items = json.items?.map(item => new PlaylistItem(item)) || [];
    Object.assign(this, json);
  }

  initialize(): void {
    // reset curPos etc
    this.curPos = 0;
    this.prevIndex = -1;

    // active indexes are the items in the playlist that should be shown
    this.activeIndexes = [];
    if (this.items) {
      for (let i = 0; i < this.items.length; i++) {
        if (!this.items[i].disabled) {
          this.activeIndexes.push(i);
        }
      }

      if (this.shufflePlay) {
        this.shuffleItems();
      }
    }

    this.curPosHolder = this.curPos;
    this.incrementCurPos();
    this.nextPosHolder = this.curPos;
  }

  incrementCurPos(): void {
    this.prevIndex = this.activeIndexes[this.nextPosHolder];
    this.curPosHolder = this.nextPosHolder;

    this.curPos += 1;

    if (this.curPos >= this.activeIndexes.length) {
      this.curPos = 0;
      if (this.shufflePlay === true) {
        this.shuffleItems();
      }
    }

    this.nextPosHolder = this.curPos;
  }

  getCurrentPlaylistItem(): PlaylistItem | undefined {
    return this.items[this.activeIndexes[this.curPosHolder]];
  }

  getNextPlaylistItem(): PlaylistItem | undefined {
    return this.items[this.activeIndexes[this.nextPosHolder]];
  }

  shuffleItems(): void {
    if (this.activeIndexes.length > 1) {
      // we don't want the first item in the new play order to be the same as the last item displayed
      let lastIndex = this.prevIndex;
      let newFirstIndex = lastIndex;
      while (newFirstIndex === lastIndex) {
        this.activeIndexes.sort(() => Math.random() - 0.5);
        newFirstIndex = this.activeIndexes[0];
      }
    }
  }

  hasItemsToDisplay(): boolean {
    let isEmpty = true;

    if (this.items && this.items.length > 0) {
      // Check that at least 1 item is enabled
      for (let i = 0; i < this.items.length; i++) {
        if (!this.items[i].disabled) {
          isEmpty = false;
          break;
        }
      }
    }
    return !isEmpty;
  }

  getOrientationAngle(): number {
    let angle: number;
    switch (this.orientation) {
      case 'portrait':
        angle = 90;
        break;
      case 'reverse_landscape':
        angle = 180;
        break;
      case 'reverse_portrait':
        angle = 270;
        break;
      default:
        angle = 0;
    }
    return angle;
  }

  async savePlaylistToAsyncStorage(): Promise<void> {
    await AsyncStorage.setItem('playlist', JSON.stringify(this));
  }

  async retrievePlaylistFromAsyncStorage(): Promise<void> {
    const playlistJson = await AsyncStorage.getItem('playlist');
    if (playlistJson) {
      Object.assign(this, JSON.parse(playlistJson));
      this.curPos = 0;
      this.curPosHolder = 0;
      this.nextPosHolder = 0;
      this.prevIndex = -1;
    }
  }

  areAllPlaylistItemsTheSame(playlist2: Playlist): boolean {
    if (this.items?.length !== playlist2.items?.length) return false;

    if (this.items?.length > 0) {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].mediafileId !== playlist2.items[i].mediafileId) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'mediafileId mismatch: ' +
                this.items[i].mediafileId +
                ' !== ' +
                playlist2.items[i].mediafileId,
            );
          return false;
        }

        if (this.items[i].webAppId !== playlist2.items[i].webAppId) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'webAppId mismatch: ' +
                this.items[i].webAppId +
                ' !== ' +
                playlist2.items[i].webAppId,
            );
          return false;
        }

        if (this.items[i].displayDuration !== playlist2.items[i].displayDuration) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'displayDuration mismatch: ' +
                this.items[i].displayDuration +
                ' !== ' +
                playlist2.items[i].displayDuration,
            );
          return false;
        }

        if (this.items[i].filename !== playlist2.items[i].filename) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'filename mismatch: ' +
                this.items[i].filename +
                ' !== ' +
                playlist2.items[i].filename,
            );
          return false;
        }

        if (this.items[i].filenameSecondary !== playlist2.items[i].filenameSecondary) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'filenameSecondary mismatch: ' +
                this.items[i].filenameSecondary +
                ' !== ' +
                playlist2.items[i].filenameSecondary,
            );
          return false;
        }

        if (this.items[i].url !== playlist2.items[i].url) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'url mismatch: ' + this.items[i].url + ' !== ' + playlist2.items[i].url,
            );
          return false;
        }

        if (this.items[i].urlParams !== playlist2.items[i].urlParams) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'urlParams mismatch: ' +
                this.items[i].urlParams +
                ' !== ' +
                playlist2.items[i].urlParams,
            );
          return false;
        }

        if (this.items[i].zoom !== playlist2.items[i].zoom) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'zoom mismatch: ' + this.items[i].zoom + ' !== ' + playlist2.items[i].zoom,
            );
          return false;
        }

        if (this.items[i].transition !== playlist2.items[i].transition) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'transition mismatch: ' +
                this.items[i].transition +
                ' !== ' +
                playlist2.items[i].transition,
            );
          return false;
        }

        if (this.items[i].transitionSpeed !== playlist2.items[i].transitionSpeed) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'transitionSpeed mismatch: ' +
                this.items[i].transitionSpeed +
                ' !== ' +
                playlist2.items[i].transitionSpeed,
            );
          return false;
        }

        if (this.items[i].disabled !== playlist2.items[i].disabled) {
          if (DEBUG && DEBUG_API_COMMS)
            console.log(
              'disabled mismatch: ' +
                this.items[i].disabled +
                ' !== ' +
                playlist2.items[i].disabled,
            );
          return false;
        }
      }
    }

    return true;
  }

  equals(playlist2: Playlist): boolean {
    if (this.mode !== playlist2.mode) return false;
    if (this.orientation !== playlist2.orientation) return false;
    if (this.fitItem !== playlist2.fitItem) return false;
    if (this.fitItemOpposing !== playlist2.fitItemOpposing) return false;
    if (this.checkForUpdatesInterval !== playlist2.checkForUpdatesInterval) return false;
    if (this.defaultTransition !== playlist2.defaultTransition) return false;
    if (this.defaultTransitionSpeed !== playlist2.defaultTransitionSpeed) return false;
    if (this.shufflePlay !== playlist2.shufflePlay) return false;
    if (this.enableImageTransitions !== playlist2.enableImageTransitions) return false;
    if (this.enableWebappTransitions !== playlist2.enableWebappTransitions) return false;

    return this.areAllPlaylistItemsTheSame(playlist2);
  }
}
