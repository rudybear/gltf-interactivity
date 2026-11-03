import { describe, expect, it } from "vitest";
import { gdFloatLiteral, simulateGodotFloatParse } from "../src/index.js";

const bitsOf = (x: number): string => {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, x);
  return `m.f64FromBits(${dv.getBigInt64(0)})`;
};

describe("gdFloatLiteral", () => {
  it("keeps readable plain literals for values Godot parses exactly", () => {
    for (const [x, s] of [
      [0, "0.0"],
      [1, "1.0"],
      [-5, "-5.0"],
      [0.5, "0.5"],
      [0.1, "0.1"],
      [3.14, "3.14"],
      [1e21, "1e+21"],
      [1.5e300, "1.5e+300"],
      [1e308, "1e+308"]
    ] as const) {
      expect(gdFloatLiteral(x)).toBe(s);
    }
  });

  it("emits exact bits for -0, subnormals and values Godot's strtod misrounds", () => {
    expect(gdFloatLiteral(-0)).toBe("m.f64FromBits(-9223372036854775808)");
    for (const x of [5e-324, 1e-310, 2.2250738585072014e-308, 9007199254740991, 7679528789200015, 0.45913173191066836, 2.60464476415712e-297, -5e-324]) {
      expect(gdFloatLiteral(x)).toBe(bitsOf(x));
    }
  });

  it("keeps NaN / infinities symbolic", () => {
    expect(gdFloatLiteral(NaN)).toBe("NAN");
    expect(gdFloatLiteral(Infinity)).toBe("INF");
    expect(gdFloatLiteral(-Infinity)).toBe("-INF");
  });

  it("only prints a plain literal when the Godot parse model returns the same double", () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 2000; i += 1) {
      const x = (rnd() - 0.5) * 10 ** Math.floor(rnd() * 40 - 20);
      const lit = gdFloatLiteral(x);
      if (!lit.startsWith("m.f64FromBits")) {
        expect(simulateGodotFloatParse(lit.replace(/^-/, "")), lit).toBe(Math.abs(x));
      }
    }
  });

  it("matches probed Godot 4.3 results", () => {
    // value Godot actually produced for the literal (godot --headless probe)
    expect(simulateGodotFloatParse("9007199254740991.0")).toBe(9007199254740990);
    expect(simulateGodotFloatParse("5e-324")).toBe(0);
    expect(simulateGodotFloatParse("0.45913173191066836")).toBe(0.4591317319106683);
    expect(simulateGodotFloatParse("0.1")).toBe(0.1);
  });
});
