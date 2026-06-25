import { expect, test } from "@playwright/test";
import type { MonitoringSnapshot } from "@/types/monitoring";

async function readFirstSseSnapshot(baseURL: string, environment: string) {
  const controller = new AbortController();
  const response = await fetch(`${baseURL}/api/monitoring/stream?environment=${environment}`, {
    signal: controller.signal
  });

  expect(response.ok).toBe(true);
  expect(response.body).not.toBeNull();

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const deadline = Date.now() + 15_000;

  try {
    while (Date.now() < deadline) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const match = buffer.match(/data: (.*)\n\n/);

      if (match) {
        return JSON.parse(match[1]) as MonitoringSnapshot;
      }
    }
  } finally {
    controller.abort();
    await reader.cancel().catch(() => undefined);
  }

  throw new Error("SSE stream did not emit an initial monitoring snapshot.");
}

test("dashboard renders the operations console without browser errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure();

    if (failure?.errorText !== "net::ERR_ABORTED") {
      failedRequests.push(`${request.method()} ${request.url()} ${failure?.errorText ?? ""}`);
    }
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Aegis-Monitor" })).toBeVisible();
  await expect(page.getByText("SSE Live")).toBeVisible();
  await expect(page.getByText("Production Readiness")).toBeVisible();

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("monitoring API and SSE stream preserve selected environment", async ({ request }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;

  expect(baseURL).toBeTruthy();

  const response = await request.get("/api/monitoring?environment=preview&cache=bypass", {
    headers: {
      "x-ops-role": "responder"
    }
  });
  const body = await response.json();

  expect(response.ok()).toBe(true);
  expect(body.ok).toBe(true);
  expect(body.data.environment).toBe("preview");

  const snapshot = await readFirstSseSnapshot(baseURL!, "staging");

  expect(snapshot.environment).toBe("staging");
});
