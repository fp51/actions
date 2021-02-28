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
exports.rebasePullsWorkflow = void 0;
/* eslint-disable no-console */
const github_1 = require("@actions/github");
function rebasePullWorkflow(github, pullNumber, onRebase, onRebaseError) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield github.pulls.get({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            // eslint-disable-next-line camelcase
            pull_number: pullNumber,
        });
        const { status, data: pull } = response;
        if (status !== 200) {
            throw new Error(`Can't get pull ${pullNumber}. Status ${response.status}.`);
        }
        if (pull.state !== 'open') {
            console.log(`PR #${pullNumber} is not open. Skipping.`);
            return 'Nothing to do';
        }
        if (pull.mergeable_state === 'clean') {
            console.log(`PR #${pullNumber} mergeable_state is clean. Nothing to do. Skipping.`);
            return 'Nothing to do';
        }
        try {
            // if PR is not mergeable, manual conflict resolution is required
            if (pull.mergeable === false) {
                console.log(`Pull request #${pullNumber} is not mergeable`);
                yield onRebaseError(pullNumber, 'not mergeable');
                return 'Cannot rebase';
            }
            // if PR is not rebaseable, manual conflict resolution is required
            if (pull.rebaseable === false) {
                console.log(`Pull request #${pullNumber} is not rebaseable`);
                yield onRebaseError(pullNumber, 'not rebaseable');
                return 'Cannot rebase';
            }
            const rebaseResult = yield onRebase(pull);
            if (rebaseResult === 'nothing to do') {
                return 'Nothing to do';
            }
            return 'Rebased';
        }
        catch (error) {
            const { head } = pull;
            console.log(`Unknown error rebasing ${head.ref} for PR ${pullNumber}`);
            console.error(error);
            yield onRebaseError(pullNumber, 'unknown');
            return 'Cannot rebase';
        }
    });
}
function rebasePullsWorkflow(github, pullNumbers, onlyFirstPulls, onRebase, onRebaseError) {
    return __awaiter(this, void 0, void 0, function* () {
        let pullsIndex = 0;
        do {
            if (pullsIndex >= pullNumbers.length) {
                console.log('Nothing to rebase anymore');
                return;
            }
            const pullNumber = pullNumbers[pullsIndex];
            // eslint-disable-next-line no-await-in-loop
            const result = yield rebasePullWorkflow(github, pullNumber, onRebase, onRebaseError);
            if (result === 'Rebased') {
                console.log(`Pull #${pullNumber} rebased`);
            }
            else if (result === 'Nothing to do') {
                console.log(`Nothing to do for #${pullNumber}`);
            }
            else {
                console.log(`Cannot rebase #${pullNumber}`);
            }
            // stop after one pulls rebased if onlyFirstpulls is true
            if (onlyFirstPulls && result === 'Rebased') {
                return;
            }
            // try to rebase next pulls
            // eslint-disable-next-line no-plusplus
            pullsIndex++;
        } while (true);
    });
}
exports.rebasePullsWorkflow = rebasePullsWorkflow;
