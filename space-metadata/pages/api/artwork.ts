// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { pipeline, Readable } from "stream";
import "../../public/assets/Assets.css";
import path from "path";
import Jimp from "jimp";
import { getText } from "../../helpers/common";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const x = req.query.x;
  const y = req.query.y;

  console.log(process);

  if (typeof x === "string" && typeof y === "string") {

    for (let i = 0; i < 13; i++)
      path.resolve("./public", `assets/font/AttilaSansSharpTrial-Bold.ttf_${i.toString().padStart(2,'0')}.png`);

    const font_file = path.resolve(
      "./public",
      "assets/font/AttilaSansSharpTrial-Bold.ttf.fnt"
    );
    const font = await Jimp.loadFont(font_file);

    console.log('before read');
    const img = await Jimp.read(
      path.resolve("./public", "assets/space-1.png")
    ).then((res: any) => {
      return res.print(
        font,
        0,
        -25,
        {
          text: getText(x,y),
          alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        },

        res.bitmap.width,
        res.bitmap.height
      );
    });

    res.setHeader("Content-Type", "image/png");
    res.status(200);
    img.getBuffer(Jimp.MIME_PNG, (err: any, buffer: any) => {
      res.write(buffer);
    });
  }

  res.end();
}
