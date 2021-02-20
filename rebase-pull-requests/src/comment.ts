import { context } from '@actions/github';
import {} from '@octokit/rest';

import { GitHub, PullGetResponse } from './github';

export async function sendPRComment(
  github: GitHub,
  prNumber: PullGetResponse['number'],
  message: string
) {
  return github.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,

    issue_number: prNumber,

    body: message,
  });
}
