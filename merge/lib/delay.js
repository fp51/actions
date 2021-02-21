"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
const delay = (millis) => new Promise((resolve) => setTimeout(resolve, millis));
exports.delay = delay;
