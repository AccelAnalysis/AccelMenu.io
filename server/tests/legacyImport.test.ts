import fs from "fs";
import path from "path";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../src/app";
import prisma from "../src/lib/prisma";
import { parseLegacyBundle } from "../src/lib/legacyImport";

const API_KEY = process.env.API_KEY ?? "test-api-key";
const loadFixture = () => {
  const filePath = path.join(__dirname, "fixtures", "legacy-bundle.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
};

beforeEach(async () => {
  await prisma.playlistEntry.deleteMany();
  await prisma.slide.deleteMany();
  await prisma.screen.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("parseLegacyBundle", () => {
  it("normalizes legacy structures and surfaces warnings", () => {
    const parsed = parseLegacyBundle(loadFixture());

    expect(parsed.slides).toHaveLength(2);
    expect(parsed.screens).toHaveLength(2);
    expect(parsed.playlistEntries).toHaveLength(2);
    expect(parsed.warnings.length).toBeGreaterThan(0);

    const welcomeSlide = parsed.slides.find((slide) => slide.id === "slide-legacy-1");
    expect(welcomeSlide).toBeDefined();
    expect(welcomeSlide?.duration).toBe(12000);
    expect(welcomeSlide?.order).toBe(5);

    const fallbackScreen = parsed.screens.find((screen) => screen.name === "Second Screen");
    expect(fallbackScreen).toBeDefined();
    expect(fallbackScreen?.status).toBe("ACTIVE");
  });
});

describe("/api/import/legacy", () => {
  it("imports legacy payloads idempotently with a summary", async () => {
    const payload = loadFixture();

    const firstResponse = await request(app)
      .post("/api/import/legacy")
      .set("x-api-key", API_KEY)
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.counts.inserted).toEqual({
      slides: 2,
      screens: 2,
      playlistEntries: 2,
    });

    const secondResponse = await request(app)
      .post("/api/import/legacy")
      .set("x-api-key", API_KEY)
      .send(payload);

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.counts.inserted).toEqual({
      slides: 0,
      screens: 0,
      playlistEntries: 0,
    });
    expect(secondResponse.body.counts.skipped).toEqual({
      slides: 2,
      screens: 2,
      playlistEntries: 2,
    });
  });
});
