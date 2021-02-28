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
exports.Git = void 0;
const github_1 = require("@actions/github");
const exec_1 = require("@actions/exec");
function Git(token, user) {
    const url = `https://x-access-token:${token}@github.com/${github_1.context.repo.owner}/${github_1.context.repo.repo}.git`;
    const execGit = (args, options = {}) => __awaiter(this, void 0, void 0, function* () {
        const result = yield exec_1.exec('git', args, options);
        if (result !== 0) {
            throw new Error(`Command git ${args.join(' ')} failed`);
        }
    });
    const init = () => __awaiter(this, void 0, void 0, function* () {
        yield execGit(['config', 'user.name', user.name]);
        yield execGit(['config', 'user.email', user.email]);
        yield execGit(['remote', 'set-url', 'origin', url]);
    });
    const checkout = (branch) => execGit(['checkout', branch]);
    const fetch = (branch) => execGit(['fetch', 'origin', branch]);
    const rebase = (ref) => execGit(['rebase', ref]);
    const currentSha = (ref) => __awaiter(this, void 0, void 0, function* () {
        let output = '';
        const listeners = {
            stdline: (data) => {
                output += data;
            },
        };
        yield execGit(['rev-parse', ref], { listeners });
        return output.trim();
    });
    const push = () => execGit(['push', '--force-with-lease']);
    const currentBranch = () => __awaiter(this, void 0, void 0, function* () {
        let output = '';
        const listeners = {
            stdline: (data) => {
                output += data;
            },
        };
        yield execGit(['branch', '--show-current'], {
            listeners,
        });
        return output.trim();
    });
    return {
        init,
        fetch,
        checkout,
        rebase,
        push,
        currentSha,
        currentBranch,
    };
}
exports.Git = Git;
