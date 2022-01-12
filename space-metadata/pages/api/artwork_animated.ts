// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {getText} from '../../helpers/common'

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const x = req.query.x;
  const y = req.query.y;

  if (typeof x === "string" && typeof y === "string") {
    const html = `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <link rel="stylesheet" href="/assets/Assets.css">
        <title>Space</title>
      </head>
      
      <body class="center">
        <img id="background", src="/assets/space.gif" draggable="false">
        <svg id= "foreground", xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 960 960" shape-rendering="crispEdges">
          <text
            style="font-family: Attila;text-anchor: middle;text-align: center;fill: #E9D9EA; font-size: 144px"
            x="480" y="900">${getText(x,y)}</text>
        </svg>
      </body>
      
      </html>`;

    res.setHeader("Content-Type", "text/html");

    res.status(200);
    res.write(html);
    res.end();
  }
}
