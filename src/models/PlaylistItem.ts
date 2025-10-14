/**
 * Class to hold an individual playlist item
 */
export class PlaylistItem {
  mediafileId: number | null;
  webAppId: number | null;
  filename: string;
  downloadUrl: string;
  filenameSecondary: string;
  url: string;
  urlParams: string;
  zoom: number | null;
  displayDuration: number;
  transition: string;
  transitionSpeed: number | null;
  fileType: string;
  fileSize: number | null;
  orientation: string;
  disabled: boolean;
  title: string;

  constructor(options: Partial<PlaylistItem> = {}) {
    this.mediafileId = null;
    this.webAppId = null;
    this.filename = '';
    this.downloadUrl = '';
    this.filenameSecondary = '';
    this.url = '';
    this.urlParams = '';
    this.zoom = null;
    this.displayDuration = 10;
    this.transition = '';
    this.transitionSpeed = null;
    this.fileType = '';
    this.fileSize = null;
    this.orientation = 'landscape';
    this.disabled = false;
    this.title = '';
    Object.assign(this, options);
  }

  equals(item2: PlaylistItem): boolean {
    if (this.mediafileId !== item2.mediafileId) return false;
    if (this.webAppId !== item2.webAppId) return false;
    if (this.displayDuration !== item2.displayDuration) return false;
    if (this.filename !== item2.filename) return false;
    if (this.filenameSecondary !== item2.filenameSecondary) return false;
    if (this.url !== item2.url) return false;
    if (this.urlParams !== item2.urlParams) return false;
    if (this.zoom !== item2.zoom) return false;
    if (this.transition !== item2.transition) return false;
    if (this.transitionSpeed !== item2.transitionSpeed) return false;
    if (this.disabled !== item2.disabled) return false;

    return true;
  }
}
