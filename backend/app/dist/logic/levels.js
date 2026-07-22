"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xpRequiredForLevel = xpRequiredForLevel;
exports.levelFromXp = levelFromXp;
const BASE = 100;
const EXPONENT = 1.5;
function xpRequiredForLevel(level) {
    return Math.floor(BASE * Math.pow(Math.max(level - 1, 0), EXPONENT));
}
// levelFromXp(xp) = highest level n (>= 1) such that xpRequiredForLevel(n) <= xp
function levelFromXp(xp) {
    if (xp < xpRequiredForLevel(2))
        return 1;
    let lvl = Math.floor(Math.pow(xp / BASE, 1 / EXPONENT)) + 1;
    while (xpRequiredForLevel(lvl + 1) <= xp)
        lvl += 1;
    while (lvl > 1 && xpRequiredForLevel(lvl) > xp)
        lvl -= 1;
    return lvl;
}
