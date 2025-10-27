# Media Converter

A React + Vite application that allows users to convert videos and images to different formats.

## Features

### Video Converter Tab
- 📤 **Video Upload**: Drag & drop or click to upload videos
- 🔄 **Format Conversion**: Convert videos to multiple formats
- 🎵 **Audio Extraction**: Extract audio from videos as MP3
- 👁️ **Preview**: Preview both original and converted videos
- 💾 **Download**: Download your converted videos or audio

### Image Converter Tab
- 📷 **Image Upload**: Drag & drop or click to upload images
- 📏 **Resize Images**: Resize images by pixels with aspect ratio control
- 🔄 **Format Conversion**: Convert images to JPEG, PNG, WebP, BMP
- ✂️ **Crop Images**: Crop your images before conversion
- 💾 **Download**: Download your converted/cropped/resized images

## Supported Formats

### Video Formats
- Input: MP4, WebM, MOV, AVI, MKV
- Output: MP4, WebM, MOV, AVI, MKV, MP3

### Image Formats
- Input: JPEG, PNG, WebP, GIF, BMP
- Output: JPEG, PNG, WebP, BMP

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

### Video Conversion
1. Select "Video Converter" tab
2. Upload a video by dragging it to the upload area or clicking to browse
3. Select your desired output format (video format or MP3 for audio extraction)
4. Click "Convert to [FORMAT]"
5. Wait for the conversion to complete
6. Preview and download your converted video or audio file

### Image Conversion
1. Select "Image Converter & Crop" tab
2. Upload an image by dragging it to the upload area or clicking to browse
3. **Resize**: Enter custom width/height in pixels (with aspect ratio toggle)
4. **OR Convert**: Select your desired output format (JPEG, PNG, WebP, BMP)
5. **OR Crop**: Use the crop tool to select a portion of the image
6. Preview and download your processed image

## Technology Stack

- React 18
- Vite
- FFmpeg.wasm for client-side video processing
- Modern CSS with gradients and animations

## Notes

- Video conversion happens entirely in your browser (client-side)
- Large videos may take some time to convert
- The conversion quality depends on the original video quality
