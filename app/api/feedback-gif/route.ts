import { NextResponse } from "next/server";

export const runtime = "nodejs";

const correctTags = [
  "celebrate",
  "success",
  "congratulations",
  "happy dance",
  "thumbs up",
];

const wrongTags = ["oops", "try again", "fail", "facepalm", "keep trying"];

// Cadangan jika GIPHY_API_KEY tidak tersedia atau permintaan ke Giphy gagal.
const correctFallback = [
  "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif",
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
];

const wrongFallback = [
  "https://media.giphy.com/media/3oEjI80DSa1grNPTDq/giphy.gif",
  "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3o7TKVfu4rwyscasla/giphy.gif",
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function jsonNoStore(url: string) {
  return NextResponse.json(
    { url },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isWrong = searchParams.get("result") === "wrong";
  const tags = isWrong ? wrongTags : correctTags;
  const fallback = isWrong ? wrongFallback : correctFallback;

  const apiKey = process.env.GIPHY_API_KEY;

  if (apiKey) {
    try {
      const tag = encodeURIComponent(pickRandom(tags));
      const giphyResponse = await fetch(
        `https://api.giphy.com/v1/gifs/random?api_key=${apiKey}&tag=${tag}&rating=g`,
        { cache: "no-store" }
      );

      if (giphyResponse.ok) {
        const payload = (await giphyResponse.json()) as {
          data?: {
            images?: {
              downsized_medium?: { url?: string };
              original?: { url?: string };
            };
          };
        };

        const url =
          payload.data?.images?.downsized_medium?.url ??
          payload.data?.images?.original?.url;

        if (url) {
          return jsonNoStore(url);
        }
      }
    } catch {
      // Abaikan dan gunakan cadangan di bawah.
    }
  }

  return jsonNoStore(pickRandom(fallback));
}
