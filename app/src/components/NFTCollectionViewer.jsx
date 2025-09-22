import React, { useState, useEffect } from 'react'
import ipfsService from '../services/ipfsService'

const NFTCollectionViewer = ({ collectionCID }) => {
  const [collection, setCollection] = useState(null)
  const [nftMetadata, setNftMetadata] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (collectionCID) {
      loadCollection()
    }
  }, [collectionCID])

  const loadCollection = async () => {
    setLoading(true)
    setError(null)

    try {
      const collectionData = await ipfsService.getJSON(collectionCID)
      setCollection(collectionData)

      // Load individual NFT metadata
      const metadataPromises = collectionData.nfts.map(async (nft) => {
        try {
          const metadata = await ipfsService.getJSON(nft.metadata_cid)
          return { nftId: nft.id, metadata }
        } catch (err) {
          console.error(`Failed to load metadata for NFT ${nft.id}:`, err)
          return { nftId: nft.id, metadata: null }
        }
      })

      const metadataResults = await Promise.all(metadataPromises)
      const metadataMap = {}
      metadataResults.forEach(result => {
        metadataMap[result.nftId] = result.metadata
      })

      setNftMetadata(metadataMap)
    } catch (err) {
      setError(`Failed to load collection: ${err.message}`)
      console.error('Collection loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!collectionCID) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No collection CID provided. Upload a collection first.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading collection...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8d7da', 
        color: '#721c24', 
        border: '1px solid #f5c6cb', 
        borderRadius: '4px'
      }}>
        {error}
      </div>
    )
  }

  if (!collection) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Collection not found.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>NFT Collection Viewer</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>{collection.name}</h3>
        <p>{collection.description}</p>
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
          <span><strong>Total Supply:</strong> {collection.total_supply}</span>
          <span><strong>NFT Count:</strong> {collection.nft_count}</span>
          <span><strong>Created:</strong> {new Date(collection.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div>
        <h3>NFTs in Collection</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {collection.nfts.map(nft => {
            const metadata = nftMetadata[nft.id]
            return (
              <div key={nft.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                <h4>{nft.name}</h4>
                <p><strong>Copies:</strong> {nft.copies}</p>
                
                {metadata ? (
                  <div>
                    <p><strong>Description:</strong> {metadata.description}</p>
                    <p><strong>Image CID:</strong> 
                      <code style={{ fontSize: '10px', marginLeft: '5px' }}>{nft.image_cid}</code>
                    </p>
                    <p><strong>Metadata CID:</strong> 
                      <code style={{ fontSize: '10px', marginLeft: '5px' }}>{nft.metadata_cid}</code>
                    </p>
                    
                    {metadata.attributes && metadata.attributes.length > 0 && (
                      <div>
                        <strong>Attributes:</strong>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                          {metadata.attributes.map((attr, index) => (
                            <li key={index}>
                              <strong>{attr.trait_type}:</strong> {attr.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: '#dc3545' }}>Failed to load metadata</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h4>Collection Structure:</h4>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(collection, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default NFTCollectionViewer
