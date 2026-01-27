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

### PDF Editor Tab
- 📄 **PDF Upload**: Drag & drop or click to upload PDF files
- 📝 **Add Text**: Click anywhere on PDF to add custom text
- 🖍️ **Add Highlights**: Click anywhere to add highlights
- 📄 **Click-to-Place**: Edit exactly where you want in the PDF
- 📄 **Page Navigation**: Navigate through multiple pages
- 💾 **Download**: Download your edited PDF with all changes

### Social Download Tab
- 🎬 **Multi-Platform**: Download from YouTube, Instagram, Twitter/X, TikTok, Facebook, Reddit, Pinterest
- 🔗 **Paste URL**: Simply paste any social media link
- ⬇️ **Direct Download**: Get instant download links
- 🎨 **Platform Detection**: Automatic platform recognition
- 🌐 **Backend Connected**: Uses Express.js backend server

## Supported Formats

### Video Formats
- Input: MP4, WebM, MOV, AVI, MKV
- Output: MP4, WebM, MOV, AVI, MKV, MP3

### Image Formats
- Input: JPEG, PNG, WebP, GIF, BMP
- Output: JPEG, PNG, WebP, BMP

## Getting Started

### Frontend Setup

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` (Vite default)

### Backend Setup (For Social Download)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Install yt-dlp (required for downloads)
sudo apt install yt-dlp
# or
pip install yt-dlp

# Start the backend server
npm start
# or
./start.sh
```

The backend will run on `http://localhost:3001`

**Note**: Social Download feature requires the backend server to be running.

### Build for Production

```bash
npm run build
```

### Custom domain: priyankaclass.buzz

The frontend is set up to be served at **https://priyankaclass.buzz**.

1. **Vercel** (recommended)
   - Deploy the repo and then: Project → **Settings** → **Domains** → Add `priyankaclass.buzz`.
   - Add `www.priyankaclass.buzz` as well if you want it; redirect one to the other in the Domains UI.
   - At your domain registrar, add the CNAME/A records Vercel shows (e.g. `cname.vercel-dns.com` for the apex or `www`).

2. **Other host (Netlify, Render static, etc.)**
   - Build: `npm run build`; serve the `dist/` folder.
   - In the host’s dashboard, add `priyankaclass.buzz` and follow their DNS instructions.

3. **Backend / API**
   - If the app calls your own backend, set `VITE_BACKEND_URL` to that API URL (e.g. your Render backend).
   - In the backend, allow `https://priyankaclass.buzz` in CORS so the browser can call the API from this domain.

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

### PDF Editing
1. Select "PDF Editor" tab
2. Upload a PDF file by dragging it to the upload area or clicking to browse
3. Click "📝 Add Text" or "🖍️ Add Highlight" to enter edit mode
4. Click anywhere on the PDF to place your annotation at that exact location
5. Repeat to add more annotations
6. Navigate between pages if your PDF has multiple pages
7. Download the edited PDF with all your changes

## Technology Stack

- React 18
- Vite
- FFmpeg.wasm for client-side video processing
- pdf-lib for PDF editing capabilities
- Express.js for backend API
- yt-dlp for social media downloading
- Modern CSS with gradients and animations

## Notes

- Video conversion happens entirely in your browser (client-side)
- Large videos may take some time to convert
- The conversion quality depends on the original video quality
- Social Download requires a backend server to be running
- See `BACKEND_SETUP.md` for detailed backend setup instructions

## Project Structure

```
react_udemy/
├── src/                    # Frontend React app
│   ├── components/        # React components
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── backend/               # Backend API server
│   ├── server.js          # Express.js server
│   ├── package.json        # Backend dependencies
│   └── downloads/         # Downloaded media files
├── public/                # Static assets
└── package.json           # Frontend dependencies
```
