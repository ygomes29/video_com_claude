import { describe, expect, it } from "vitest";
import {
  isTerminalStatus,
  normalizeClipStatus,
  PROCESSING_SUBSTAGES,
  statusToStageLabel,
  TERMINAL_STATUSES,
} from "../polling";

describe("normalizeClipStatus", () => {
  it("maps known MuAPI statuses", () => {
    expect(normalizeClipStatus("queued")).toBe("queued");
    expect(normalizeClipStatus("pending")).toBe("pending");
    expect(normalizeClipStatus("processing")).toBe("processing");
    expect(normalizeClipStatus("running")).toBe("processing");
    expect(normalizeClipStatus("completed")).toBe("completed");
    expect(normalizeClipStatus("succeeded")).toBe("completed");
    expect(normalizeClipStatus("success")).toBe("completed");
    expect(normalizeClipStatus("failed")).toBe("failed");
    expect(normalizeClipStatus("error")).toBe("failed");
    expect(normalizeClipStatus("cancelled")).toBe("cancelled");
    expect(normalizeClipStatus("canceled")).toBe("cancelled");
  });

  // Case: JSON inesperado / unknown status → keep polling (processing).
  it("collapses unknown / non-string values to processing (keeps polling)", () => {
    expect(normalizeClipStatus("something-weird")).toBe("processing");
    expect(normalizeClipStatus(undefined)).toBe("processing");
    expect(normalizeClipStatus(null)).toBe("processing");
    expect(normalizeClipStatus(42)).toBe("processing");
    expect(normalizeClipStatus({ x: 1 })).toBe("processing");
  });

  it("is case-insensitive", () => {
    expect(normalizeClipStatus("COMPLETED")).toBe("completed");
    expect(normalizeClipStatus("Failed")).toBe("failed");
  });
});

describe("isTerminalStatus", () => {
  it("returns true for terminal statuses", () => {
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("failed")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
  });

  it("returns false for non-terminal statuses", () => {
    expect(isTerminalStatus("queued")).toBe(false);
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("processing")).toBe(false);
  });

  it("TERMINAL_STATUSES contains exactly the terminal set", () => {
    expect([...TERMINAL_STATUSES].sort()).toEqual(
      ["cancelled", "completed", "failed"].sort(),
    );
  });
});

describe("statusToStageLabel", () => {
  it("returns a PT-BR label for every known status", () => {
    expect(statusToStageLabel("queued")).toBe("Preparando...");
    expect(statusToStageLabel("pending")).toBe("Preparando...");
    expect(statusToStageLabel("processing")).toBe("Processando...");
    expect(statusToStageLabel("completed")).toBe("Concluído");
    expect(statusToStageLabel("failed")).toBe("Falhou");
    expect(statusToStageLabel("cancelled")).toBe("Cancelado");
  });

  it("PROCESSING_SUBSTAGES are non-empty PT-BR steps", () => {
    expect(PROCESSING_SUBSTAGES.length).toBeGreaterThan(0);
    for (const s of PROCESSING_SUBSTAGES) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }
  });
});