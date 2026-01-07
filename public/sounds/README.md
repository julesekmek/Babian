# Sound Notification Setup

## Quick Setup

The public display expects a sound file at `/public/sounds/cycle-end.mp3`.

### Option 1: Use a Free Sound Effect

Download a short notification sound (0.5-1s) from:
- [Freesound.org](https://freesound.org/) (search "notification" or "beep")
- [Zapsplat.com](https://www.zapsplat.com/) (free with attribution)

Save as `public/sounds/cycle-end.mp3`

### Option 2: Generate a Simple Beep (macOS/Linux)

```bash
# Using ffmpeg to generate a 0.5s beep at 800Hz
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.5" -ar 44100 public/sounds/cycle-end.mp3
```

### Option 3: Temporary Placeholder

Until you add a real sound file, the app will work fine - it just won't play audio on cycle end. The sound hook gracefully handles missing files.

## Testing

1. Navigate to `/public/[barId]` in your browser
2. Click anywhere on the page (required for autoplay policy)
3. Wait for the countdown to reach 0
4. You should hear the notification sound

## Customization

To change the sound file, simply replace `public/sounds/cycle-end.mp3` with your preferred audio file. Keep it:
- **Short**: 0.5-1 second
- **Pleasant**: Not jarring or annoying
- **Clear**: Audible but not overwhelming
