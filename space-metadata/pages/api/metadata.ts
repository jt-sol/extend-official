// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const x = req.query.x;
  const y = req.query.y;

  res.status(200).json({
    name: `Space (${x},${y})`,
    symbol: "EXT",
    description: "We want to extend NFT's into a new dimension, to go beyond our current interpretation of NFT. The word 'extend' evokes that shift... from Super Nintendo to N64, from Motorola bloatware to a functioning app store, from profile picture flex to a living artifact of culture and community. The canvas is just the first application for Spaces, but theoretically any information can be associated with a user's Space and live on the Solana blockchain as account data.",
    seller_fee_basis_points: 0,
    image: `https://metadata.extend.xyz/api/artwork?ext=png&x=${x}&y=${y}`,
    animation_url: `https://metadata.extend.xyz/api/artwork_animated?x=${x}&y=${y}`,
    external_url: "https://www.extend.xyz",
    attributes: [
      { 
        trait_type: "x", 
        value: x 
      },
      { 
        trait_type: "y", 
        value: y 
      }
    ],
    collection: {
      name: "Extend",
    },
    properties: {
      files: [
        {
          uri: `https://metadata.extend.xyz/api/artwork?ext=png&x=${x}&y=${y}`,
          type: "image/png"
        }
      ],
        category: "html",
      creators: [
        { 
          address: "qubfadT15XGKcETYpQHBraKQ5fx92ttEAT5KBejEAXL", 
          share: 100 
        }
      ]
    }
  } as any)
}
