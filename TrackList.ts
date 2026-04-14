import { Song } from '../domain/Song';
import { TrackNode } from './TrackNode';

/**
 * TrackList — Doubly Linked List for managing an ordered
 * sequence of TrackNodes.
 *
 * This is the `DoublyLinkedList` from the spec, renamed to
 * express its specific role in the audio domain.
 *
 * Complexity summary:
 *   addToEnd    — O(1)   tail pointer
 *   addToStart  — O(1)   head pointer
 *   addAtIndex  — O(n)   walk to position
 *   remove      — O(1)   given a node reference
 *   findById    — O(n)   linear scan
 *   toArray     — O(n)   full traversal
 */
export class TrackList {
  private head: TrackNode | null = null;
  private tail: TrackNode | null = null;
  private length: number = 0;

  // ── Accessors ────────────────────────────────────────────

  get size(): number          { return this.length; }
  get headNode(): TrackNode | null { return this.head; }
  get tailNode(): TrackNode | null { return this.tail; }
  get isEmpty(): boolean      { return this.length === 0; }

  // ── Insertion ────────────────────────────────────────────

  /** Append a song at the end of the list.  O(1) */
  addToEnd(song: Song): TrackNode {
    const node = new TrackNode(song);

    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      node.prev      = this.tail;
      this.tail.next = node;
      this.tail      = node;
    }

    this.length++;
    return node;
  }

  /** Prepend a song at the beginning.  O(1) */
  addToStart(song: Song): TrackNode {
    const node = new TrackNode(song);

    if (!this.head) {
      this.head = this.tail = node;
    } else {
      node.next      = this.head;
      this.head.prev = node;
      this.head      = node;
    }

    this.length++;
    return node;
  }

  /**
   * Insert at a 1-based position index.
   * Automatically clamps to [1, size + 1].
   * addAtIndex(song, 1)          ≡ addToStart
   * addAtIndex(song, size + 1)   ≡ addToEnd
   * O(n)
   */
  addAtIndex(song: Song, index: number): TrackNode {
    const clamped = Math.max(1, Math.min(index, this.length + 1));

    if (clamped === 1)              return this.addToStart(song);
    if (clamped === this.length + 1) return this.addToEnd(song);

    // Walk to node just before the target position
    let cursor = this.head as TrackNode;
    for (let i = 1; i < clamped - 1; i++) {
      cursor = cursor.next as TrackNode;
    }

    const node    = new TrackNode(song);
    node.next     = cursor.next;
    node.prev     = cursor;

    if (cursor.next) cursor.next.prev = node;
    cursor.next = node;

    this.length++;
    return node;
  }

  // ── Removal ──────────────────────────────────────────────

  /**
   * Remove a node by reference.  O(1)
   * The caller must guarantee the node belongs to this list.
   */
  remove(node: TrackNode): void {
    if (node.prev) node.prev.next = node.next;
    else           this.head = node.next;

    if (node.next) node.next.prev = node.prev;
    else           this.tail = node.prev;

    node.prev = node.next = null;
    this.length--;
  }

  // ── Search ───────────────────────────────────────────────

  /** Find a node by song id.  O(n) */
  findById(id: string): TrackNode | null {
    let cursor = this.head;
    while (cursor) {
      if (cursor.song.id === id) return cursor;
      cursor = cursor.next;
    }
    return null;
  }

  /** Find the node at a 1-based index.  O(n) */
  findAtIndex(index: number): TrackNode | null {
    if (index < 1 || index > this.length) return null;
    let cursor = this.head;
    for (let i = 1; i < index; i++) {
      cursor = cursor?.next ?? null;
    }
    return cursor;
  }

  // ── Traversal ────────────────────────────────────────────

  /** Return all nodes in order as an array.  O(n) */
  toArray(): TrackNode[] {
    const result: TrackNode[] = [];
    let cursor = this.head;
    while (cursor) {
      result.push(cursor);
      cursor = cursor.next;
    }
    return result;
  }

  /** Return all songs in order.  O(n) */
  getSongs(): Song[] {
    return this.toArray().map(n => n.song);
  }

  // ── Mutation ─────────────────────────────────────────────

  /** Clear the entire list.  O(1) */
  clear(): void {
    this.head = this.tail = null;
    this.length = 0;
  }

  // ── Serialization ────────────────────────────────────────

  /**
   * Serialize to a plain array of DTOs for JSON persistence.
   * Order is preserved (head → tail).
   */
  serialize(): ReturnType<Song['toJSON']>[] {
    return this.getSongs().map(s => s.toJSON());
  }
}
