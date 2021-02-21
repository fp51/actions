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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const label_1 = require("./label");
const comment_1 = require("./comment");
const delay_1 = require("./delay");
const RETRY_DELAY = 5000;
const hasLabel = (label, pull) => {
    const { labels } = pull;
    return labels.find((currentLanel) => currentLanel.name === label);
};
function merge(github, pullNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield github.pulls.get({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            pull_number: pullNumber,
        });
        if (response.status !== 200) {
            throw new Error(`Cannot get pull request #${pullNumber}. Status ${response.status}.`);
        }
        const pull = response.data;
        if (label && !hasLabel(label, pull)) {
            console.log(`Pull request has no ${label} label. Stopping.`);
            return 'skip';
        }
        if (pull.state !== 'open') {
            console.log(`Pull request is not open. Stopping.`);
            return 'skip';
        }
        console.log(`Mergeable is ${pull.mergeable}`);
        console.log(`Mergeable state is ${pull.mergeable_state}`);
        if (pull.mergeable === null) {
            console.log('Need retry');
            return 'need retry';
        }
        if (pull.mergeable !== true) {
            return 'impossible';
        }
        if (pull.mergeable_state === 'blocked' ||
            pull.mergeable_state === 'draft' ||
            pull.mergeable_state === 'behind') {
            console.log(`Mergeable state is ${pull.mergeable_state}. Stopping`);
            return 'skip';
        }
        const mergeResponse = yield github.pulls.merge({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            pull_number: pullNumber,
        });
        if (mergeResponse.status === 200) {
            return 'done';
        }
        else {
            throw new Error(`Failed to merge #${pullNumber}. Status ${mergeResponse.status}`);
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const githubToken = core.getInput('token', {
                required: true,
            });
            const pullNumber = parseInt(core.getInput('pullNumber'), 10);
            if (isNaN(pullNumber)) {
                throw Error('Cannot parse pull number');
            }
            const label = core.getInput('label') || null;
            const github = github_1.getOctokit(githubToken);
            let numberRetries = 1;
            let result = 'need retry';
            do {
                console.log(`Will try to merge pull request #${pullNumber}`);
                result = yield merge(github, pullNumber, label);
                console.log(`Merge result is ${result}`);
                numberRetries++;
                yield delay_1.delay(RETRY_DELAY);
            } while (numberRetries < 21 && result === 'need retry');
            if (result !== 'done' && result !== 'skip') {
                console.log(`Failed to merge pull request #${pullNumber}`);
                if (label) {
                    yield label_1.removePRLabel(github, pullNumber, label);
                    yield comment_1.sendPRComment(github, pullNumber, `Removing label ${label} because pull request is not mergeable `);
                }
                return;
            }
            if (result === 'done') {
                console.log(`Pull request #${pullNumber} merged`);
            }
        }
        catch (error) {
            console.error(error);
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
