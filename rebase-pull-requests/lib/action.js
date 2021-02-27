"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tmp_1 = __importDefault(require("tmp"));
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const exec_1 = require("@actions/exec");
const search_1 = require("./search");
const rebase_1 = require("./rebase");
const git_1 = require("./git");
const comment_1 = require("./comment");
const label_1 = require("./label");
const buildErrorComment = (reason) => {
    switch (reason) {
        case 'not mergeable':
            return 'Skipping rebase because this pull request is not mergeable';
        case 'not rebaseable':
            return 'Skipping rebase because this pull request is not rebaseable';
        case 'cannot rebase':
            return 'Can not rebase the pull request';
        case 'unknown':
            return 'Ooops. Unknown error occurred during rebase.';
    }
};
function checkoutRebaseAndPush(git, pull) {
    return __awaiter(this, void 0, void 0, function* () {
        const { base, head } = pull;
        console.log('Init git');
        yield git.init();
        console.log(`Fetch current head ${head.ref} branch`);
        yield git.fetch(head.ref);
        console.log(`Retrieve up-to-date head sha for ${head.ref} branch`);
        const currentSha = yield git.currentSha(`origin/${head.ref}`);
        console.log(`Up-to-date head sha is ${head.sha}`);
        console.log(`Local head sha is ${currentSha}`);
        if (head.sha !== currentSha) {
            console.log(`Pull request has been updated while running action. Skipping.`);
            return 'nothing to do';
        }
        console.log(`Checkout ${head.ref} branch`);
        yield git.checkout(head.ref);
        console.log(`Fetch current base ${base.ref} branch`);
        yield git.fetch(base.ref);
        console.log(`Rebasing ${head.ref} on ${base.ref}`);
        yield git.rebase(`origin/${base.ref}`);
        const branchAfterRebase = yield git.currentBranch();
        console.log('Current branch after rebase:', branchAfterRebase);
        if (branchAfterRebase !== head.ref) {
            // we're not on the branch after the rebase, rebase failed (conflict, etc.)
            throw new Error('Rebase did not end on the branch');
        }
        yield git.push();
        return 'done';
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const githubToken = core.getInput('token', {
                required: true,
            });
            const baseNameOrRef = core.getInput('base', {
                required: true,
            });
            const base = baseNameOrRef.replace('refs/heads/', '');
            const label = core.getInput('label') || null;
            const onlyOne = core.getInput('onlyOne') === 'true';
            const github = github_1.getOctokit(githubToken);
            const pulls = yield search_1.searchForPullsToRebase(github, base, label);
            console.log(`${pulls.length} pull requests found`);
            if (pulls.length === 0) {
                console.log('Nothing to do');
                return;
            }
            else {
                const prNumbers = pulls.map((pr) => pr.number);
                yield rebase_1.rebasePullsWorkflow(github, prNumbers, onlyOne, (pull) => __awaiter(this, void 0, void 0, function* () {
                    let tmpDir = {
                        name: '',
                        removeCallback: () => { },
                    };
                    try {
                        tmpDir = tmp_1.default.dirSync({ unsafeCleanup: true });
                        // copy the current directory somewhere to not affect the repo
                        yield exec_1.exec('cp', ['-r', '.', tmpDir.name]);
                        const git = git_1.Git(githubToken, tmpDir.name);
                        return checkoutRebaseAndPush(git, pull);
                    }
                    finally {
                        tmpDir && tmpDir.removeCallback();
                    }
                }), (pullNumber, reason) => __awaiter(this, void 0, void 0, function* () {
                    if (label) {
                        console.log(`Removing ${label} label for #${pullNumber}`);
                        yield label_1.removePRLabel(github, pullNumber, label);
                    }
                    console.log(`Comment on ${pullNumber}`);
                    const comment = buildErrorComment(reason);
                    yield comment_1.sendPRComment(github, pullNumber, comment);
                }));
            }
        }
        catch (error) {
            console.error(error);
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
