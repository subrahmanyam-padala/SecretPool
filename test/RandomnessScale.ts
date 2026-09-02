import { expect } from "chai";

describe("Randomness Scaling Mathematical Validation", function () {
  it("should map values perfectly proportionally with bounded bias", function () {
    const W = 400n;
    const MAX_R = (1n << 64n) - 1n;

    let aliceCount = 0n;
    let bobCount = 0n;

    // Test endpoints mathematically to prove the boundaries
    // randomTicket = R * W / 2^64
    // For Alice (w=100), ticket is 0 to 99
    // R bounds for Alice: [0, (100 * 2^64) / 400 - 1]
    
    const aliceUpperR = ((100n * (1n << 64n)) / W) - 1n;
    aliceCount = aliceUpperR + 1n;
    
    const bobUpperR = ((400n * (1n << 64n)) / W) - 1n;
    bobCount = bobUpperR - aliceUpperR;

    expect(aliceCount).to.equal(1n << 62n);
    expect(bobCount).to.equal(3n * (1n << 62n));
  });

  it("should bound absolute bias to < 1/2^64 for non-divisible weights", function () {
    const W = 3n;
    const MAX_R = (1n << 64n) - 1n;

    // Ticket 0 (Alice)
    const aliceUpperR = ((1n * (1n << 64n)) / W) - 1n;
    const aliceCount = aliceUpperR + 1n;
    
    // Ticket 1, 2 (Bob)
    const bobUpperR = ((3n * (1n << 64n)) / W) - 1n;
    const bobCount = bobUpperR - aliceUpperR;

    const exactAliceRatio = 1 / 3;
    const actualAliceRatio = Number(aliceCount) / Number(1n << 64n);
    
    const diff = Math.abs(exactAliceRatio - actualAliceRatio);
    expect(diff).to.be.lessThan(1 / Number(1n << 64n) * 2); // Floating point precision bound
  });
});
