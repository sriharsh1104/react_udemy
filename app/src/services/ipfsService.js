import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'

class IPFSService {
  constructor() {
    this.helia = null
    this.fs = null
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) return

    try {
      this.helia = await createHelia()
      this.fs = unixfs(this.helia)
      this.isInitialized = true
      console.log('IPFS initialized successfully')
    } catch (error) {
      console.error('Failed to initialize IPFS:', error)
      throw error
    }
  }

  async uploadFile(file) {
    await this.initialize()
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      const cid = await this.fs.addBytes(uint8Array)
      console.log(`File uploaded with CID: ${cid}`)
      return cid.toString()
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  async uploadJSON(data) {
    await this.initialize()
    
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const uint8Array = new TextEncoder().encode(jsonString)
      
      const cid = await this.fs.addBytes(uint8Array)
      console.log(`JSON uploaded with CID: ${cid}`)
      return cid.toString()
    } catch (error) {
      console.error('Failed to upload JSON:', error)
      throw error
    }
  }

  async uploadFolder(files) {
    await this.initialize()
    
    try {
      const uploadResults = {}
      
      // Upload each file
      for (const [path, file] of Object.entries(files)) {
        const cid = await this.uploadFile(file)
        uploadResults[path] = cid
      }
      
      return uploadResults
    } catch (error) {
      console.error('Failed to upload folder:', error)
      throw error
    }
  }

  async createNFTFolderStructure(nftData, files) {
    await this.initialize()
    
    try {
      const uploadResults = {}
      
      // Upload image files
      for (const [filename, file] of Object.entries(files)) {
        const cid = await this.uploadFile(file)
        uploadResults[filename] = cid
      }
      
      // Generate and upload metadata for each NFT
      const metadataResults = {}
      for (const nft of nftData.nfts) {
        const metadata = {
          name: nft.name,
          description: nft.description,
          image: `ipfs://${uploadResults[nft.image]}`,
          copies: nft.copies,
          attributes: nft.attributes,
          ...nft.metadata
        }
        
        const metadataCID = await this.uploadJSON(metadata)
        metadataResults[nft.id] = {
          metadataCID,
          imageCID: uploadResults[nft.image],
          copies: nft.copies
        }
      }
      
      // Upload collection metadata
      const collectionMetadata = {
        name: nftData.collectionName,
        description: nftData.collectionDescription,
        total_supply: nftData.totalSupply,
        nft_count: nftData.nfts.length,
        created_at: new Date().toISOString(),
        nfts: nftData.nfts.map(nft => ({
          id: nft.id,
          name: nft.name,
          copies: nft.copies,
          metadata_cid: metadataResults[nft.id].metadataCID,
          image_cid: metadataResults[nft.id].imageCID
        }))
      }
      
      const collectionCID = await this.uploadJSON(collectionMetadata)
      
      return {
        collectionCID,
        metadataResults,
        uploadResults
      }
    } catch (error) {
      console.error('Failed to create NFT folder structure:', error)
      throw error
    }
  }

  async getFile(cid) {
    await this.initialize()
    
    try {
      const chunks = []
      for await (const chunk of this.fs.cat(cid)) {
        chunks.push(chunk)
      }
      
      const uint8Array = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let offset = 0
      for (const chunk of chunks) {
        uint8Array.set(chunk, offset)
        offset += chunk.length
      }
      
      return uint8Array
    } catch (error) {
      console.error('Failed to get file:', error)
      throw error
    }
  }

  async getJSON(cid) {
    try {
      const uint8Array = await this.getFile(cid)
      const jsonString = new TextDecoder().decode(uint8Array)
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Failed to get JSON:', error)
      throw error
    }
  }

  async stop() {
    if (this.helia) {
      await this.helia.stop()
      this.isInitialized = false
    }
  }
}

export default new IPFSService()
