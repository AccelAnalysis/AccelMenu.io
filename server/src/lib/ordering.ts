import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "./prisma";

type NormalizationClient = PrismaClient | Prisma.TransactionClient;

function hasTransaction(client: NormalizationClient): client is PrismaClient {
  return typeof (client as PrismaClient).$transaction === "function";
}

export async function normalizePlaylistPositions(
  screenId: string,
  client: NormalizationClient = prisma,
  useTransaction: boolean = true
): Promise<void> {
  const entries = await client.playlistEntry.findMany({
    where: { screenId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  const updates = entries.map((entry, index) =>
    client.playlistEntry.update({
      where: { id: entry.id },
      data: { position: index },
    })
  );

  if (updates.length === 0) {
    return;
  }

  if (useTransaction && hasTransaction(client)) {
    await client.$transaction(updates);
  } else {
    await Promise.all(updates);
  }
}
