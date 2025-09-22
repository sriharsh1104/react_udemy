import React, { useState, useRef } from 'react'
import ipfsService from '../services/ipfsService'
import { dummyNFTCollection } from '../data/dummyNFTs'
import NFTCollectionViewer from './NFTCollectionViewer'

const NFTUploader = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState({})
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const files = event.target.files
    const fileMap = {}
    
    Array.from(files).forEach(file => {
      fileMap[file.name] = file
    })
    
    setSelectedFiles(fileMap)
    setError(null)
  }

  const generateDummyFiles = () => {
    // Create dummy file objects for testing
    const dummyFiles = {}
    
    dummyNFTCollection.nfts.forEach(nft => {
      // Create a dummy image file (in real app, these would be actual image files)
      const dummyImageFile = new File(
        [`Dummy image data for ${nft.name}`], 
        nft.image, 
        { type: 'image/png' }
      )
      dummyFiles[nft.image] = dummyImageFile
    })
    
    setSelectedFiles(dummyFiles)
    setError(null)
  }

  const handleUpload = async () => {
    if (Object.keys(selectedFiles).length === 0) {
      setError('Please select files or generate dummy data first')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const results = await ipfsService.createNFTFolderStructure(dummyNFTCollection, selectedFiles)
      setUploadResults(results)
      console.log('Upload successful:', results)
    } catch (err) {
      setError(`Upload failed: ${err.message}`)
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>NFT Collection Uploader</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Upload NFT Collection to IPFS</h2>
        <p>This demo uploads NFT metadata and images to IPFS and creates CID mappings.</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Step 1: Prepare Files</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*"
            style={{ padding: '8px' }}
          />
          <button 
            onClick={generateDummyFiles}
            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Generate Dummy Data
          </button>
        </div>
        
        {Object.keys(selectedFiles).length > 0 && (
          <div>
            <p><strong>Selected Files:</strong></p>
            <ul>
              {Object.keys(selectedFiles).map(filename => (
                <li key={filename}>{filename}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Step 2: Upload to IPFS</h3>
        <button
          onClick={handleUpload}
          disabled={uploading || Object.keys(selectedFiles).length === 0}
          style={{
            padding: '12px 24px',
            backgroundColor: uploading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Collection'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {uploadResults && (
        <div style={{ marginTop: '20px' }}>
          <h3>Upload Results</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>Collection Metadata CID:</h4>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6', 
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <code>{uploadResults.collectionCID}</code>
              <button 
                onClick={() => copyToClipboard(uploadResults.collectionCID)}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>NFT Metadata CIDs:</h4>
            {Object.entries(uploadResults.metadataResults).map(([nftId, data]) => (
              <div key={nftId} style={{ marginBottom: '15px' }}>
                <h5>NFT #{nftId} - {dummyNFTCollection.nfts.find(nft => nft.id == nftId)?.name}</h5>
                <div style={{ marginLeft: '20px' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Metadata CID:</strong>
                    <div style={{ 
                      padding: '5px', 
                      backgroundColor: '#f8f9fa', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <code style={{ fontSize: '12px' }}>{data.metadataCID}</code>
                      <button 
                        onClick={() => copyToClipboard(data.metadataCID)}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <strong>Image CID:</strong>
                    <div style={{ 
                      padding: '5px', 
                      backgroundColor: '#f8f9fa', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <code style={{ fontSize: '12px' }}>{data.imageCID}</code>
                      <button 
                        onClick={() => copyToClipboard(data.imageCID)}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '5px' }}>
                    <strong>Copies:</strong> {data.copies}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4>File Upload CIDs:</h4>
            {Object.entries(uploadResults.uploadResults).map(([filename, cid]) => (
              <div key={filename} style={{ 
                padding: '5px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px',
                marginBottom: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span><strong>{filename}:</strong> <code style={{ fontSize: '12px' }}>{cid}</code></span>
                <button 
                  onClick={() => copyToClipboard(cid)}
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collection Viewer */}
      {uploadResults && (
        <div style={{ marginTop: '40px', borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
          <NFTCollectionViewer collectionCID={uploadResults.collectionCID} />
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h4>How it works:</h4>
        <ol>
          <li>Each NFT image is uploaded to IPFS and gets a unique CID</li>
          <li>NFT metadata JSON is created with the image CID reference</li>
          <li>Metadata JSON is uploaded to IPFS and gets its own CID</li>
          <li>Collection metadata is created mapping all NFT CIDs</li>
          <li>Collection metadata is uploaded to IPFS</li>
          <li>You can use these CIDs to reference your NFTs on IPFS</li>
        </ol>
      </div>
    </div>
  )
}

export default NFTUploader
