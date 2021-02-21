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
exports.searchForPullsToRebase = void 0;
const github_1 = require("@actions/github");
function searchForPullsToRebase(github, base, label) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseQuery = `repo:${github_1.context.repo.owner}/${github_1.context.repo.repo} is:pr base:${base} state:open`;
        const query = label ? `${baseQuery} label:"${label}"` : baseQuery;
        const response = yield github.search.issuesAndPullRequests({
            q: query,
            sort: 'created',
            order: 'asc',
            per_page: 10,
        });
        if (response.status !== 200) {
            throw new Error(`Cannot search for pull requests. Code ${response.status}`);
        }
        const { data: { items }, } = response;
        const pullRequests = items;
        return pullRequests;
    });
}
exports.searchForPullsToRebase = searchForPullsToRebase;
