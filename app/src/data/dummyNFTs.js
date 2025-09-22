// Dummy NFT data for testing
export const dummyNFTCollection = {
  collectionName: "Digital Art Collection",
  collectionDescription: "A collection of unique digital artworks",
  totalSupply: 100,
  nfts: [
    {
      id: 1,
      name: "Cosmic Dreams #1",
      description: "A mesmerizing cosmic artwork featuring swirling galaxies",
      image: "cosmic_dreams_1.png",
      copies: 5,
      attributes: [
        { trait_type: "Background", value: "Cosmic" },
        { trait_type: "Color", value: "Purple" },
        { trait_type: "Rarity", value: "Common" }
      ],
      metadata: {
        external_url: "https://example.com/nft/1",
        animation_url: null,
        background_color: "000000"
      }
    },
    {
      id: 2,
      name: "Ocean Waves #1",
      description: "Serene ocean waves captured in digital form",
      image: "ocean_waves_1.png",
      copies: 3,
      attributes: [
        { trait_type: "Background", value: "Ocean" },
        { trait_type: "Color", value: "Blue" },
        { trait_type: "Rarity", value: "Rare" }
      ],
      metadata: {
        external_url: "https://example.com/nft/2",
        animation_url: null,
        background_color: "0066cc"
      }
    },
    {
      id: 3,
      name: "Forest Guardian #1",
      description: "A mystical guardian spirit of the ancient forest",
      image: "forest_guardian_1.png",
      copies: 1,
      attributes: [
        { trait_type: "Background", value: "Forest" },
        { trait_type: "Color", value: "Green" },
        { trait_type: "Rarity", value: "Legendary" }
      ],
      metadata: {
        external_url: "https://example.com/nft/3",
        animation_url: null,
        background_color: "00aa00"
      }
    },
    {
      id: 4,
      name: "Fire Phoenix #1",
      description: "A legendary phoenix rising from flames",
      image: "fire_phoenix_1.png",
      copies: 2,
      attributes: [
        { trait_type: "Background", value: "Fire" },
        { trait_type: "Color", value: "Red" },
        { trait_type: "Rarity", value: "Epic" }
      ],
      metadata: {
        external_url: "https://example.com/nft/4",
        animation_url: null,
        background_color: "cc0000"
      }
    },
    {
      id: 5,
      name: "Ice Crystal #1",
      description: "Beautiful crystalline ice formations",
      image: "ice_crystal_1.png",
      copies: 4,
      attributes: [
        { trait_type: "Background", value: "Ice" },
        { trait_type: "Color", value: "White" },
        { trait_type: "Rarity", value: "Uncommon" }
      ],
      metadata: {
        external_url: "https://example.com/nft/5",
        animation_url: null,
        background_color: "ffffff"
      }
    }
  ]
};

// Generate metadata JSON for each NFT
export const generateNFTMetadata = (nft) => {
  return {
    name: nft.name,
    description: nft.description,
    image: `ipfs://${nft.image}`, // This will be replaced with actual CID
    copies: nft.copies,
    attributes: nft.attributes,
    ...nft.metadata
  };
};

// Generate collection metadata
export const generateCollectionMetadata = (collection) => {
  return {
    name: collection.collectionName,
    description: collection.collectionDescription,
    total_supply: collection.totalSupply,
    nft_count: collection.nfts.length,
    created_at: new Date().toISOString(),
    nfts: collection.nfts.map(nft => ({
      id: nft.id,
      name: nft.name,
      copies: nft.copies,
      metadata_cid: null, // Will be populated after upload
      image_cid: null     // Will be populated after upload
    }))
  };
};
