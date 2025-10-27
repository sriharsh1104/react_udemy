# Video Format Converter

A React + Vite application that allows users to upload videos and convert them to different formats (MP4, WebM, AVI, MOV, MKV).

## Features

- 📤 **Video Upload**: Drag & drop or click to upload videos
- 🔄 **Format Conversion**: Convert videos to multiple formats
- 🎵 **Audio Extraction**: Extract audio from videos as MP3
- 👁️ **Preview**: Preview both original and converted videos
- 💾 **Download**: Download your converted videos or audio

## Supported Formats

- Input: MP4, WebM, MOV, AVI, MKV
- Output: MP4, WebM, MOV, AVI, MKV, MP3

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## How It Works

1. Upload a video by dragging it to the upload area or clicking to browse
2. Select your desired output format (video format or MP3 for audio extraction)
3. Click "Convert to [FORMAT]"
4. Wait for the conversion to complete
5. Preview and download your converted video or audio file

## Technology Stack

- React 18
- Vite
- FFmpeg.wasm for client-side video processing
- Modern CSS with gradients and animations

## Notes

- Video conversion happens entirely in your browser (client-side)
- Large videos may take some time to convert
- The conversion quality depends on the original video quality
