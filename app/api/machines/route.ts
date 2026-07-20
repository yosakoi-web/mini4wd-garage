import { desc, eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
import { machines } from "../../../db/schema";

type PartEntry = { itemNumber: string; name: string };

type MachinePayload = {
  name?: string;
  chassis?: string;
  body?: string;
  motor?: string;
  motorRpm?: number;
  gearRatio?: number;
  tireDiameter?: number;
  weight?: number;
  frontParts?: PartEntry[];
  sideParts?: PartEntry[];
  rearParts?: PartEntry[];
  internalParts?: PartEntry[];
  detectedParts?: unknown[];
  photoKeys?: Record<string, string>;
  memo?: string;
};

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function serializeMachine(machine: typeof machines.$inferSelect) {
  return {
    ...machine,
    frontParts: parseJson(machine.frontParts, []),
    sideParts: parseJson(machine.sideParts, []),
    rearParts: parseJson(machine.rearParts, []),
    internalParts: parseJson(machine.internalParts, []),
    detectedParts: parseJson(machine.detectedParts, []),
    photoKeys: parseJson(machine.photoKeys, {}),
  };
}

export async function GET() {
  try {
    await ensureDatabase();
    const rows = await getDb()
      .select()
      .from(machines)
      .orderBy(desc(machines.updatedAt));
    return Response.json({ machines: rows.map(serializeMachine) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存データを取得できませんでした";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as MachinePayload;
    const name = payload.name?.trim() ?? "";
    const chassis = payload.chassis?.trim() ?? "";
    if (!name || !chassis) {
      return Response.json({ error: "マシン名とシャーシは必須です" }, { status: 400 });
    }

    const now = Date.now();
    const record: typeof machines.$inferInsert = {
      id: crypto.randomUUID(),
      name,
      chassis,
      body: payload.body?.trim() ?? "",
      motor: payload.motor?.trim() ?? "",
      motorRpm: Number(payload.motorRpm) || 20000,
      gearRatio: Number(payload.gearRatio) || 4,
      tireDiameter: Number(payload.tireDiameter) || 26,
      weight: Number(payload.weight) || 0,
      frontParts: JSON.stringify(payload.frontParts ?? []),
      sideParts: JSON.stringify(payload.sideParts ?? []),
      rearParts: JSON.stringify(payload.rearParts ?? []),
      internalParts: JSON.stringify(payload.internalParts ?? []),
      detectedParts: JSON.stringify(payload.detectedParts ?? []),
      photoKeys: JSON.stringify(payload.photoKeys ?? {}),
      memo: payload.memo?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    };

    const [saved] = await getDb().insert(machines).values(record).returning();
    return Response.json({ machine: serializeMachine(saved) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "マシンを保存できませんでした";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDatabase();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return Response.json({ error: "削除対象が指定されていません" }, { status: 400 });
    }
    await getDb().delete(machines).where(eq(machines.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "マシンを削除できませんでした";
    return Response.json({ error: message }, { status: 500 });
  }
}
