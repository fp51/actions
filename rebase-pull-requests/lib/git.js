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
const execCommand = (command, options) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield exec_1.exec(command, [], options);
    if (result !== 0) {
        throw new Error(`Command ${command} failed`);
    }
});
function Git(token, directory) {
    const url = `https://x-access-token:${token}@github.com/${github_1.context.repo.owner}/${github_1.context.repo.repo}.git`;
    const execOptions = {
        cwd: directory,
    };
    const init = () => __awaiter(this, void 0, void 0, function* () {
        yield execCommand('git config --global user.name "Rebase Action"', execOptions);
        yield execCommand(`git remote set-url origin ${url}`, execOptions);
    });
    const checkout = (branch) => execCommand(`git checkout ${branch}`, execOptions);
    const fetch = (branch) => execCommand(`git fetch origin ${branch}`, execOptions);
    const rebase = (ref) => execCommand(`git rebase ${ref}`, execOptions);
    const currentSha = (ref) => __awaiter(this, void 0, void 0, function* () {
        let output = '';
        const listeners = {
            stdline: (data) => {
                output += data;
            },
        };
        yield execCommand(`git rev-parse ${ref}`, Object.assign(Object.assign({}, execOptions), { listeners }));
        return output.trim();
    });
    const push = () => execCommand(`git push --force-with-lease`, execOptions);
    const currentBranch = () => __awaiter(this, void 0, void 0, function* () {
        let output = '';
        const listeners = {
            stdline: (data) => {
                output += data;
            },
        };
        yield execCommand('git branch --show-current', Object.assign(Object.assign({}, execOptions), { listeners }));
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
