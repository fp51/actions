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
/* eslint-disable no-console */
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const githubToken = core.getInput('token', {
                required: true,
            });
            const defaultRepository = process.env.GITHUB_REPOSITORY || null;
            if (!defaultRepository) {
                throw new Error('Missing GITHUB_REPOSITORY env var');
            }
            const repository = core.getInput('repository') || defaultRepository;
            const currentRef = process.env.GITHUB_REF || null;
            const ref = core.getInput('branch') || currentRef;
            if (!ref) {
                throw new Error('Missing GITHUB_REF and branch input. Cannot get branch info');
            }
            // ref looks like refs/heads/my-branch
            // TODO could also be a tag (https://help.github.com/en/articles/virtual-environments-for-github-actions)
            // should we handle it here ?
            const branch = ref.replace('refs/heads/', '');
            console.log(`Trying to find pull request for branch ${branch}`);
            const github = github_1.getOctokit(githubToken);
            const query = `repo:${repository} is:pr head:${branch}`;
            const { status, data } = yield github.search.issuesAndPullRequests({
                q: query,
                sort: 'updated',
                order: 'desc',
                // eslint-disable-next-line camelcase
                per_page: 1,
            });
            if (status !== 200) {
                throw Error(`Search request error. Status ${status}`);
            }
            const { items: pulls } = data;
            if (pulls.length === 0) {
                console.log('Found 0 pull request');
                core.setOutput('pullExists', 'false');
                core.setOutput('pullNumber', '-1');
                return;
            }
            const pullNumbers = pulls.map((pull) => pull.number);
            console.log(`Found ${pullNumbers.length} pull requests: ${pullNumbers.join(', ')}`);
            const pullNumber = pullNumbers[0];
            core.setOutput('pullExists', 'true');
            core.setOutput('pullNumber', `${pullNumber}`);
        }
        catch (error) {
            console.error(error);
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
