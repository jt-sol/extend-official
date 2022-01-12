export const metadata = {
  name: "Space (0,0)",
  symbol: "EXT",
  description:
    "We want to extend NFT's into a new dimension, to go beyond our current interpretation of NFT. The word 'extend' evokes that shift... from Super Nintendo to N64, from Motorola bloatware to a functioning app store, from profile picture flex to a living artifact of culture and community. The canvas is just the first application for Spaces, but theoretically any information can be associated with a user's Space and live on the Solana blockchain as account data.",
  seller_fee_basis_points: 0,
  image: "http://localhost:3000/api/artwork?ext=png&x=0&y=0",
  animation_url: "http://localhost:3000/api/artwork_animated?x=0&y=0",
  external_url: "https://extend.xyz",
  attributes: [
    { trait_type: "x", value: "0" },
    { trait_type: "y", value: "0" },
  ],
  collection: { name: "Extend", family: "Genesis" },
  properties: {
    files: [
      {
        uri: "http://localhost:3000/api/artwork?ext=png&x=0&y=0",
        type: "image/png",
      },
    ],
    category: "html",
    creators: [
      { address: "qubfadT15XGKcETYpQHBraKQ5fx92ttEAT5KBejEAXL", share: 100 },
    ],
  },
};
