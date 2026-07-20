import { getRuntimeEnv } from "../../../lib/runtime-env";

type BucketObject = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  writeHttpMetadata(headers: Headers): void;
};

type Bucket = {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
  get(key: string): Promise<BucketObject | null>;
};

function getBucket() {
  const bucket = getRuntimeEnv().BUCKET as Bucket | undefined;
  if (!bucket) throw new Error("写真保存領域が利用できません");
  return bucket;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/")) {
      return Response.json({ error: "画像ファイルを選択してください" }, { status: 400 });
    }
    if (file.size > 14 * 1024 * 1024) {
      return Response.json({ error: "写真は1枚14MB以下にしてください" }, { status: 413 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const key = `machines/${crypto.randomUUID()}-${safeName || "photo.jpg"}`;
    await getBucket().put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    return Response.json({ key, url: `/api/photos?key=${encodeURIComponent(key)}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "写真を保存できませんでした";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!key || !key.startsWith("machines/")) return new Response("Not found", { status: 404 });
    const object = await getBucket().get(key);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers({ "cache-control": "private, max-age=3600" });
    object.writeHttpMetadata(headers);
    return new Response(object.body, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
