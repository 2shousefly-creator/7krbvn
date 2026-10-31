/* Pure Ruby Farming calculations, kept independent from the user interface. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RubyCalculator = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const BUNDLE_KEYS = 60;
  const RUBIES_PER_HERO = 20;
  const BUNDLE_LIMIT = 1169;
  const BUNDLE_TIERS = [
    { through: 20, price: 50 },
    { through: 70, price: 80 },
    { through: 120, price: 100 },
    { through: 170, price: 120 },
    { through: 1169, price: 150 },
  ];
  const STAGES = [
    { number: 1, unlock: 'Adventure Normal 2-10', gold: 6000, drops: 'Hero Ticket 1–3★, Equipment 2–3★, Golden Box' },
    { number: 2, unlock: 'Adventure Normal 7-10', gold: 6500, drops: 'Hero Ticket 2–4★, Equipment 4★, Golden Box, Legendary Hero' },
    { number: 3, unlock: 'Adventure Normal 12-10', gold: 7000, drops: 'Hero Ticket 2–4★, Equipment 4★, Dedicated Equipment Box' },
    { number: 4, unlock: 'Adventure Nightmare 1-10', gold: 15000, drops: 'Hero Ticket 2–4★, Dedicated Equipment Box, Accessory Box 4★' },
    { number: 5, unlock: 'Adventure Nightmare 6-10', gold: 16000, drops: 'Hero Ticket 2–4★, Dedicated Equipment Box, Accessory Box 4–5★' },
    { number: 6, unlock: 'Adventure Nightmare 11-10', gold: 17000, drops: 'Hero Ticket 3–4★, Dedicated Equipment Box, Accessory Box 4–6★' },
    { number: 7, unlock: 'Adventure Nightmare 16-10', gold: 18000, drops: 'Hero Ticket 3–4★, Dedicated Equipment Box, Accessory Box 4–6★, Pet Egg' },
    { number: 8, unlock: 'Adventure Nightmare 21-10', gold: 19000, drops: 'Hero Ticket 3–4★, Dedicated Equipment Box, Accessory Box 4–6★, Pet Egg' },
    { number: 9, unlock: 'Adventure Nightmare 26-10', gold: 20000, drops: 'Hero Ticket 3–4★, Dedicated Equipment Box, Accessory Box 4–6★, Pet Egg' },
  ];
  const integer = (value, fallback = 0, max = 1_000_000_000) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : fallback;
  };
  const positiveDays = value => Math.max(1, Number.isFinite(Number(value)) ? Number(value) : 1);
  function costThrough(count) {
    let remaining = integer(count, 0, BUNDLE_LIMIT);
    let previous = 0;
    let cost = 0;
    for (const tier of BUNDLE_TIERS) {
      const take = Math.min(remaining, tier.through - previous);
      cost += take * tier.price;
      remaining -= take;
      previous = tier.through;
      if (remaining <= 0) break;
    }
    return cost;
  }
  function purchase(previousCount, additionalCount) {
    const previous = integer(previousCount, 0, BUNDLE_LIMIT);
    const count = Math.min(integer(additionalCount, 0, BUNDLE_LIMIT), BUNDLE_LIMIT - previous);
    const ending = previous + count;
    const next = BUNDLE_TIERS.find(tier => ending < tier.through);
    return { previous, count, ending, keys: count * BUNDLE_KEYS, cost: costThrough(ending) - costThrough(previous), nextPrice: next ? next.price : null };
  }
  function simulate(options) {
    const stage = Math.max(1, integer(options.stage, 1, 9));
    const costPerRound = stage < 4 ? 6 : 12;
    const slots = integer(options.slots, 0, stage < 4 ? 5 : 8);
    const keys = integer(options.keys);
    const roundsPerCycle = Math.max(1, integer(options.roundsPerCycle, 11, 999));
    const availableRounds = Math.floor(keys / costPerRound);
    const finiteFodder = options.fodderLimit !== null && options.fodderLimit !== undefined && options.fodderLimit !== '';
    const fodderLimit = finiteFodder ? integer(options.fodderLimit) : Infinity;
    const neededRounds = slots > 0 && finiteFodder ? Math.ceil(fodderLimit / slots) * roundsPerCycle : Infinity;
    const rounds = slots > 0 ? Math.min(availableRounds, neededRounds) : 0;
    const cycles = Math.floor(rounds / roundsPerCycle);
    const heroes = Math.min(cycles * slots, fodderLimit);
    const keysUsed = rounds * costPerRound;
    return { stage, costPerRound, slots, keys, roundsPerCycle, rounds, cycles, heroes, grossRuby: heroes * RUBIES_PER_HERO, keysUsed, keysLeft: keys - keysUsed, remainingRounds: rounds % roundsPerCycle };
  }
  function sourceDailyValue(sources) {
    return sources.reduce((sum, source) => {
      const amount = Math.max(0, Number(source.amount) || 0);
      return sum + (source.enabled ? amount / positiveDays(source.days) : 0);
    }, 0);
  }
  return { BUNDLE_KEYS, RUBIES_PER_HERO, BUNDLE_LIMIT, BUNDLE_TIERS, STAGES, costThrough, purchase, simulate, sourceDailyValue };
});
