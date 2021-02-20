import { getOctokit } from '@actions/github';
import { Endpoints } from '@octokit/types';

export type PullGetResponse = Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}']['response']['data'];

export type GitHub = ReturnType<typeof getOctokit>;
