import { Song } from '../domain/Song';

/**
 * TrackNode — a single node in the TrackList (Doubly Linked List).
 *
 * Carries a Song payload and bi-directional pointers to
 * neighbouring nodes.  This is the `Node` class from the spec,
 * named contextually so the domain intent is obvious.
 */
export class TrackNode {
  public readonly song: Song;
  public prev: TrackNode | null = null;
  public next: TrackNode | null = null;

  constructor(song: Song) {
    this.song = song;
  }
}
