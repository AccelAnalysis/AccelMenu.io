import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../src/app";
import prisma from "../src/lib/prisma";

const API_KEY = process.env.API_KEY ?? "test-api-key";

async function createScreen(name: string = "Main Screen") {
  const response = await request(app)
    .post("/api/screens")
    .set("x-api-key", API_KEY)
    .send({ name, location: "HQ" });

  return response.body;
}

async function createSlide(order: number, title: string = "Welcome") {
  const response = await request(app)
    .post("/api/slides")
    .set("x-api-key", API_KEY)
    .send({
      title: `${title} ${order}`,
      content: { text: "Hello" },
      duration: 10,
      order,
    });

  return response.body;
}

async function createPlaylistEntry(
  screenId: string,
  slideId: string,
  position: number
) {
  const response = await request(app)
    .post("/api/playlists")
    .set("x-api-key", API_KEY)
    .send({ screenId, slideId, position });

  return response.body;
}

beforeEach(async () => {
  await prisma.playlistEntry.deleteMany();
  await prisma.slide.deleteMany();
  await prisma.screen.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Validation errors", () => {
  it("returns 400 when slide payload is invalid", async () => {
    const response = await request(app)
      .post("/api/slides")
      .set("x-api-key", API_KEY)
      .send({ duration: -1 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(Array.isArray(response.body.errors)).toBe(true);
  });
});

describe("Screen CRUD", () => {
  it("creates, reads, updates, and deletes a screen", async () => {
    const createResponse = await request(app)
      .post("/api/screens")
      .set("x-api-key", API_KEY)
      .send({ name: "Lobby", location: "Building A" });

    expect(createResponse.status).toBe(201);
    const screenId = createResponse.body.id;

    const listResponse = await request(app).get("/api/screens");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const getResponse = await request(app).get(`/api/screens/${screenId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe("Lobby");

    const updateResponse = await request(app)
      .put(`/api/screens/${screenId}`)
      .set("x-api-key", API_KEY)
      .send({ status: "INACTIVE", location: "Updated" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.status).toBe("INACTIVE");
    expect(updateResponse.body.location).toBe("Updated");

    const deleteResponse = await request(app)
      .delete(`/api/screens/${screenId}`)
      .set("x-api-key", API_KEY);

    expect(deleteResponse.status).toBe(204);

    const missingResponse = await request(app).get(`/api/screens/${screenId}`);
    expect(missingResponse.status).toBe(404);
  });
});

describe("Playlist ordering", () => {
  it("normalizes positions after reordering entries", async () => {
    const screen = await createScreen();
    const slideA = await createSlide(0, "Slide A");
    const slideB = await createSlide(1, "Slide B");
    const slideC = await createSlide(2, "Slide C");

    const entryOne = await createPlaylistEntry(screen.id, slideA.id, 0);
    const entryTwo = await createPlaylistEntry(screen.id, slideB.id, 1);
    const entryThree = await createPlaylistEntry(screen.id, slideC.id, 2);

    const reorderResponse = await request(app)
      .patch("/api/playlists/reorder")
      .set("x-api-key", API_KEY)
      .send([
        { id: entryOne.id, position: 2 },
        { id: entryTwo.id, position: 0 },
        { id: entryThree.id, position: 1 },
      ]);

    expect(reorderResponse.status).toBe(200);

    const playlistResponse = await request(app).get("/api/playlists");
    expect(playlistResponse.status).toBe(200);

    const positions = playlistResponse.body.map((entry: any) => ({
      id: entry.id,
      position: entry.position,
    }));

    expect(positions).toEqual([
      { id: entryTwo.id, position: 0 },
      { id: entryThree.id, position: 1 },
      { id: entryOne.id, position: 2 },
    ]);
  });
});
