import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";
import { dmyToIso, isoToDmy } from "./date";
import { qs } from "./api";
import { fmtDate, pctChange, initials } from "./format";
import { patientSchema, doctorSchema } from "./schemas";

describe("safeNext", () => {
  it("keeps same-site paths", () => expect(safeNext("/doctors?q=a")).toBe("/doctors?q=a"));
  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", null])("rejects %s", (v) =>
    expect(safeNext(v)).toBe("/"),
  );
});

describe("qs", () => {
  it("drops empty values", () => expect(qs({ a: "1", b: "", c: undefined, d: 0 })).toBe("?a=1&d=0"));
  it("encodes", () => expect(qs({ q: "a b&c" })).toBe("?q=a+b%26c"));
});

describe("format", () => {
  it("percent change handles a zero baseline", () => {
    expect(pctChange(10, 0)).toBeNull();
    expect(pctChange(0, 0)).toBe(0);
    expect(pctChange(15, 10)).toBe(50);
  });
  it("reads a bare date as that calendar day", () => expect(fmtDate("2026-10-31")).toBe("31 Oct 2026"));
  it("initials skip the Dr. prefix", () => expect(initials("Dr. Amina Rahman")).toBe("AR"));
});

describe("form schemas", () => {
  const patient = { name: "Karim", age: "54", gender: "male", phone: "+880 1711 000000", condition: "stable", diagnosis: "Asthma", admittedAt: "2026-01-01" };
  it("accepts a valid patient", () => expect(patientSchema.safeParse(patient).success).toBe(true));
  it("rejects an empty age instead of reading it as 0", () => expect(patientSchema.safeParse({ ...patient, age: "" }).success).toBe(false));
  it("rejects a fractional age", () => expect(patientSchema.safeParse({ ...patient, age: "4.5" }).success).toBe(false));
  it("rejects an unknown specialty", () =>
    expect(doctorSchema.safeParse({ name: "Dr. X", specialization: "Magic", hospital: "Riverside", phone: "+1 555 0100", email: "x@y.dev" }).success).toBe(false));
});

describe("DD-MM-YYYY dates", () => {
  it("converts both ways", () => {
    expect(dmyToIso("05-11-2026")).toBe("2026-11-05");
    expect(isoToDmy("2026-11-05")).toBe("05-11-2026");
  });
  it.each(["31-02-2026", "00-01-2026", "1-1-2026", "2026-11-05", ""])("rejects %s", (v) => expect(dmyToIso(v)).toBe(""));
});
