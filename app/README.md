# NFT Collection IPFS Uploader Demo

This is a React demo application that demonstrates how to upload NFT collections to IPFS with proper CID mapping between folder contents and NFT metadata.

## Features

- **Folder Upload**: Upload multiple NFT images and metadata files
- **IPFS Integration**: Uses Helia (modern IPFS library) for decentralized storage
- **CID Mapping**: Creates proper mappings between folder CIDs and individual NFT metadata CIDs
- **Multiple Copies**: Support for NFTs with multiple copies
- **Collection Management**: Upload entire collections with structured metadata
- **Real-time Preview**: View uploaded collections and their metadata

## Project Structure

```
src/
├── components/
│   ├── NFTUploader.jsx          # Main upload component
│   └── NFTCollectionViewer.jsx  # Collection display component
├── services/
│   └── ipfsService.js          # IPFS integration service
├── data/
│   └── dummyNFTs.js            # Sample NFT data
└── App.jsx                     # Main application component
```

## How It Works

### 1. NFT Structure
Each NFT collection contains:
- **Collection Metadata**: Overall collection information
- **Individual NFTs**: Each with multiple copies
- **Image Files**: Actual NFT images
- **Metadata JSON**: NFT attributes and properties

### 2. Upload Process
1. **Image Upload**: Each NFT image is uploaded to IPFS and gets a unique CID
2. **Metadata Creation**: JSON metadata is created with image CID references
3. **Metadata Upload**: Each NFT's metadata JSON is uploaded to IPFS
4. **Collection Assembly**: Collection metadata is created mapping all NFT CIDs
5. **Final Upload**: Collection metadata is uploaded to IPFS

### 3. CID Mapping
The system creates a hierarchical CID structure:
```
Collection CID
├── NFT #1 Metadata CID
│   └── Image CID
├── NFT #2 Metadata CID
│   └── Image CID
└── ...
```

## Usage

### 1. Start the Application
```bash
npm run dev
```

### 2. Upload NFT Collection
- Click "Generate Dummy Data" to create sample NFTs
- Or select actual image files using the file input
- Click "Upload Collection" to upload to IPFS

### 3. View Results
- Collection CID is displayed for the entire collection
- Individual NFT metadata CIDs are shown
- Image CIDs are mapped to their respective NFTs
- Collection viewer shows the complete structure

## Sample NFT Data

The demo includes 5 sample NFTs:
- **Cosmic Dreams #1** (5 copies) - Common rarity
- **Ocean Waves #1** (3 copies) - Rare rarity  
- **Forest Guardian #1** (1 copy) - Legendary rarity
- **Fire Phoenix #1** (2 copies) - Epic rarity
- **Ice Crystal #1** (4 copies) - Uncommon rarity

## Technical Details

### IPFS Integration
- Uses **Helia** (modern IPFS library)
- Browser-based IPFS node
- Content-addressed storage
- Decentralized file system

### Metadata Standards
- Follows NFT metadata standards
- Includes attributes and traits
- Supports multiple copies per NFT
- External URL references

### CID Structure
- **Collection CID**: Points to collection metadata
- **NFT Metadata CID**: Points to individual NFT metadata
- **Image CID**: Points to actual image files
- **Hierarchical mapping**: Easy to traverse and reference

## Benefits

1. **Decentralized Storage**: Files stored across IPFS network
2. **Immutable Content**: Content cannot be changed once uploaded
3. **Censorship Resistant**: Hard to block or remove content
4. **Version Control**: Built-in versioning system
5. **Offline Capability**: Works even when disconnected
6. **Cost Effective**: No centralized storage costs

## Future Enhancements

- Real image file support
- Batch upload optimization
- Metadata validation
- Collection statistics
- IPFS gateway integration
- Blockchain integration

## Dependencies

- React 19.1.1
- Helia (IPFS)
- @helia/unixfs
- Vite (build tool)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open browser to `http://localhost:5173`
5. Generate dummy data or upload your own files
6. Click "Upload Collection" to see IPFS integration in action

This demo showcases how to properly structure NFT collections for IPFS storage with proper CID mapping for easy retrieval and management.