import { describe, expect, it } from "vitest";
import { m } from "../src/math.js";

describe("m.* int32 wrap semantics", () => {
  it("addInt wraps at INT_MAX", () => {
    expect(m.addInt(2147483647, 1)).toBe(-2147483648);
  });
  it("subInt wraps at INT_MIN", () => {
    expect(m.subInt(-2147483648, 1)).toBe(2147483647);
  });
  it("mulInt wraps on overflow", () => {
    expect(m.mulInt(2147483647, 2)).toBe(-2);
  });
  it("absInt wraps INT_MIN (whose magnitude has no positive int32 representation)", () => {
    expect(m.absInt(-2147483648)).toBe(-2147483648);
  });
});

describe("m.* div/rem by zero", () => {
  it("divInt(x, 0) is 0 for nonzero x", () => {
    expect(m.divInt(7, 0)).toBe(0);
  });
  it("divInt(0, 0) is 0", () => {
    expect(m.divInt(0, 0)).toBe(0);
  });
  it("remInt(x, 0) is 0", () => {
    expect(m.remInt(7, 0)).toBe(0);
  });
  it("float div by zero still propagates Infinity/NaN (no int wrap involved)", () => {
    expect(m.div(1, 0)).toBe(Infinity);
    expect(m.div(-1, 0)).toBe(-Infinity);
    expect(Number.isNaN(m.div(0, 0) as number)).toBe(true);
  });
});

describe("m.ctz / m.popcnt edge cases", () => {
  it("ctz(0) is 32 (not the native clz32(0)=32 coincidence — verifying the explicit spec-mandated edge case)", () => {
    expect(m.ctz(0)).toBe(32);
  });
  it("ctz of a power of two is its bit index", () => {
    expect(m.ctz(8)).toBe(3);
  });
  it("popcnt counts over the unsigned 32-bit pattern (negative int32 has high bits set)", () => {
    // -1 as int32 is 0xFFFFFFFF: 32 set bits.
    expect(m.popcnt(-1)).toBe(32);
    expect(m.popcnt(0)).toBe(0);
    expect(m.popcnt(1)).toBe(1);
  });
});

describe("m.eq / m.eqInt / m.eqBool NaN and component-wise semantics", () => {
  it("eq is false for NaN compared to itself (component-wise, no implicit NaN-equality)", () => {
    expect(m.eq(Number.NaN, Number.NaN)).toBe(false);
  });
  it("eq is true for identical floats", () => {
    expect(m.eq(1.5, 1.5)).toBe(true);
  });
  it("eq on vectors is a per-component AND", () => {
    expect(m.eq([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(m.eq([1, 2, 3], [1, 2, 4])).toBe(false);
  });
  it("eqInt / eqBool compare scalars directly", () => {
    expect(m.eqInt(5, 5)).toBe(true);
    expect(m.eqInt(5, 6)).toBe(false);
    expect(m.eqBool(true, true)).toBe(true);
    expect(m.eqBool(true, false)).toBe(false);
  });
});

describe("m.* NaN propagation through component-wise F ops", () => {
  it("add propagates NaN", () => {
    expect(Number.isNaN(m.add(Number.NaN, 1) as number)).toBe(true);
  });
  it("isNaN detects any-component NaN in a vector", () => {
    expect(m.isNaN([1, Number.NaN, 3])).toBe(true);
    expect(m.isNaN([1, 2, 3])).toBe(false);
  });
});

describe("m.select / m.switchCase", () => {
  it("select picks a or b by the boolean condition", () => {
    expect(m.select(true, "a", "b")).toBe("a");
    expect(m.select(false, "a", "b")).toBe("b");
  });
  it("switchCase returns the matching case's value, else the default", () => {
    expect(m.switchCase(2, [1, 2, 3], ["one", "two", "three"], "none")).toBe("two");
    expect(m.switchCase(9, [1, 2, 3], ["one", "two", "three"], "none")).toBe("none");
  });
});

describe("m.normalize / m.inverse multi-output shape", () => {
  it("normalize returns {value, isValid}; zero-length vector is invalid", () => {
    const ok = m.normalize([3, 4]);
    expect(ok.isValid).toBe(true);
    expect(ok.value[0]).toBeCloseTo(0.6);
    expect(ok.value[1]).toBeCloseTo(0.8);
    const zero = m.normalize([0, 0]);
    expect(zero.isValid).toBe(false);
  });
  it("inverse reports isValid=false for a singular matrix", () => {
    const singular = m.inverse([0, 0, 0, 0]);
    expect(singular.isValid).toBe(false);
  });
});

describe("type conversions", () => {
  it("floatToInt truncates toward zero and wraps NaN/Infinity to 0", () => {
    expect(m.floatToInt(3.7)).toBe(3);
    expect(m.floatToInt(-3.7)).toBe(-3);
    expect(m.floatToInt(Number.NaN)).toBe(0);
    expect(m.floatToInt(Infinity)).toBe(0);
  });
  it("floatToBool is false iff NaN or zero", () => {
    expect(m.floatToBool(0)).toBe(false);
    expect(m.floatToBool(Number.NaN)).toBe(false);
    expect(m.floatToBool(2.5)).toBe(true);
    expect(m.floatToBool(-2.5)).toBe(true);
  });
});
