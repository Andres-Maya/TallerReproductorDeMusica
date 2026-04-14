import 'dotenv/config';
import { createApp }      from './app';
import { Song }           from './domain/Song';

const PORT = Number(process.env.PORT ?? 3000);

const { app, manager } = createApp();

// ── Seed demo data (development convenience) ─────────────────
function seedDemoData(): void {
  const playlist = manager.createPlaylist('My Favourites');

  const demoPl = manager.createPlaylist('Demo Playlist');

  const tracks = [
    new Song('Jazz in Paris',    'Media Right Productions', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
    new Song('Acoustic Breeze',  'Benjamin Tissot',         'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
    new Song('Creative Minds',   'Benjamin Tissot',         'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
    new Song('Tenderness',       'Benjamin Tissot',         'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'),
  ];

  tracks.forEach(song => {
    manager.addSongToEnd(demoPl.id, {
      title:    song.title,
      artist:   song.artist,
      audioUrl: song.audioUrl,
    });
  });

  console.log(`\x1b[36m[Seed]\x1b[0m Created playlist "${playlist.name}" (${playlist.id})`);
  console.log(`\x1b[36m[Seed]\x1b[0m Created playlist "${demoPl.name}" (${demoPl.id}) with ${tracks.length} tracks`);
}

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n\x1b[1m 🎵 Waveline Backend\x1b[0m');
  console.log(`\x1b[32m✓\x1b[0m Running on  http://localhost:${PORT}`);
  console.log(`\x1b[32m✓\x1b[0m Health      http://localhost:${PORT}/health`);
  console.log(`\x1b[32m✓\x1b[0m API base    http://localhost:${PORT}/api/v1\n`);

  seedDemoData();
});
