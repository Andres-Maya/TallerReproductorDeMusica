import { Song, CreateSongPayload } from '../domain/Song';
import { Playlist }               from '../domain/Playlist';
import { TrackList }              from '../data-structures/TrackList';
import { TrackNode }              from '../data-structures/TrackNode';

/**
 * PlaylistManager — the core application service.
 *
 * Encapsulates all playlist + playback logic.  The transport
 * layer (HTTP controllers) depends only on this interface —
 * never on TrackList or TrackNode directly.
 *
 * Responsibilities:
 *   – Manage a collection of Playlists (in-memory store).
 *   – For each playlist, maintain a TrackList.
 *   – Track the "current song" pointer per playlist.
 *   – Expose add / remove / play / next / previous operations.
 */
export class PlaylistManager {
  // In-memory stores (could be swapped for a DB adapter via DI)
  private readonly playlists  = new Map<string, Playlist>();
  private readonly trackLists = new Map<string, TrackList>();
  private readonly cursors    = new Map<string, TrackNode | null>();

  // ── Playlist CRUD ────────────────────────────────────────

  createPlaylist(name: string): Playlist {
    const playlist = new Playlist(name);
    this.playlists.set(playlist.id, playlist);
    this.trackLists.set(playlist.id, new TrackList());
    this.cursors.set(playlist.id, null);
    return playlist;
  }

  getAllPlaylists(): Playlist[] {
    return Array.from(this.playlists.values());
  }

  getPlaylist(playlistId: string): Playlist | null {
    return this.playlists.get(playlistId) ?? null;
  }

  renamePlaylist(playlistId: string, newName: string): Playlist {
    const playlist = this.requirePlaylist(playlistId);
    playlist.rename(newName);
    return playlist;
  }

  deletePlaylist(playlistId: string): void {
    this.requirePlaylist(playlistId);
    this.playlists.delete(playlistId);
    this.trackLists.delete(playlistId);
    this.cursors.delete(playlistId);
  }

  // ── Song management ──────────────────────────────────────

  /** Add a song at the end of the playlist. */
  addSongToEnd(playlistId: string, payload: CreateSongPayload): Song {
    const song = this.buildSong(payload);
    this.requireTrackList(playlistId).addToEnd(song);
    return song;
  }

  /** Add a song at the start of the playlist. */
  addSongToStart(playlistId: string, payload: CreateSongPayload): Song {
    const song = this.buildSong(payload);
    this.requireTrackList(playlistId).addToStart(song);
    return song;
  }

  /**
   * Add a song at a specific 1-based position.
   * Out-of-range values are clamped automatically by TrackList.
   */
  addSongAtIndex(
    playlistId: string,
    payload: CreateSongPayload,
    index: number
  ): Song {
    const song = this.buildSong(payload);
    this.requireTrackList(playlistId).addAtIndex(song, index);
    return song;
  }

  /** Remove a song by its id. */
  removeSong(playlistId: string, songId: string): Song {
    const list = this.requireTrackList(playlistId);
    const node = list.findById(songId);
    if (!node) throw new NotFoundError(`Song '${songId}' not found in playlist`);

    const song = node.song;

    // If the removed song is the current one, advance the cursor
    const cursor = this.cursors.get(playlistId);
    if (cursor?.song.id === songId) {
      const next = node.next ?? node.prev ?? null;
      this.cursors.set(playlistId, next);
    }

    list.remove(node);
    return song;
  }

  /** Get all songs in playlist order. */
  getSongs(playlistId: string): Song[] {
    return this.requireTrackList(playlistId).getSongs();
  }

  // ── Playback control ─────────────────────────────────────

  /** Set the current song to a specific track and return it. */
  playSong(playlistId: string, songId: string): Song {
    const list = this.requireTrackList(playlistId);
    const node = list.findById(songId);
    if (!node) throw new NotFoundError(`Song '${songId}' not found`);
    this.cursors.set(playlistId, node);
    return node.song;
  }

  /** Advance to the next song (wraps to head). */
  nextSong(playlistId: string): Song {
    const list   = this.requireTrackList(playlistId);
    if (list.isEmpty) throw new BadRequestError('Playlist is empty');

    const cursor = this.cursors.get(playlistId);
    const next   = cursor?.next ?? list.headNode;
    this.cursors.set(playlistId, next);
    return next!.song;
  }

  /** Step back to previous song (wraps to tail). */
  previousSong(playlistId: string): Song {
    const list   = this.requireTrackList(playlistId);
    if (list.isEmpty) throw new BadRequestError('Playlist is empty');

    const cursor = this.cursors.get(playlistId);
    const prev   = cursor?.prev ?? list.tailNode;
    this.cursors.set(playlistId, prev);
    return prev!.song;
  }

  /** Return the current song without changing state. */
  getCurrentSong(playlistId: string): Song | null {
    this.requirePlaylist(playlistId);
    const cursor = this.cursors.get(playlistId);
    return cursor?.song ?? null;
  }

  /** Full playback state snapshot. */
  getPlaybackState(playlistId: string): PlaybackState {
    const playlist   = this.requirePlaylist(playlistId);
    const list       = this.requireTrackList(playlistId);
    const cursor     = this.cursors.get(playlistId) ?? null;
    const songs      = list.toArray();
    const currentIdx = cursor
      ? songs.findIndex(n => n === cursor)
      : -1;

    return {
      playlistId:   playlist.id,
      playlistName: playlist.name,
      totalTracks:  list.size,
      currentIndex: currentIdx,
      currentSong:  cursor?.song.toJSON() ?? null,
      hasPrevious:  currentIdx > 0 || (currentIdx === 0 && list.size > 0),
      hasNext:      currentIdx < list.size - 1 || list.size > 0,
    };
  }

  // ── Private helpers ──────────────────────────────────────

  private buildSong(payload: CreateSongPayload): Song {
    const song = new Song(payload.title, payload.artist, payload.audioUrl);
    const errors = song.validate();
    if (errors.length > 0) throw new ValidationError(errors);
    return song;
  }

  private requirePlaylist(id: string): Playlist {
    const pl = this.playlists.get(id);
    if (!pl) throw new NotFoundError(`Playlist '${id}' not found`);
    return pl;
  }

  private requireTrackList(playlistId: string): TrackList {
    this.requirePlaylist(playlistId);
    return this.trackLists.get(playlistId)!;
  }
}

// ── Playback state DTO ───────────────────────────────────────

export interface PlaybackState {
  playlistId:   string;
  playlistName: string;
  totalTracks:  number;
  currentIndex: number;
  currentSong:  ReturnType<Song['toJSON']> | null;
  hasPrevious:  boolean;
  hasNext:      boolean;
}

// ── Domain Errors ────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError'; }
}

export class ValidationError extends Error {
  public readonly errors: string[];
  constructor(errors: string[]) {
    super(errors.join(', '));
    this.name   = 'ValidationError';
    this.errors = errors;
  }
}

export class BadRequestError extends Error {
  constructor(message: string) { super(message); this.name = 'BadRequestError'; }
}
