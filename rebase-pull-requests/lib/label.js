"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePRLabel = void 0;
const github_1 = require("@actions/github");
function removePRLabel(github, prNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        return github.issues.removeLabel({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            issue_number: prNumber,
            name: label,
        });
    });
}
exports.removePRLabel = removePRLabel;
