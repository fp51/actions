import { GitHub, context } from '@actions/github';
import { PullsGetResponse } from '@octokit/rest';

export async function sendPRComment(
  github: GitHub,
  prNumber: PullsGetResponse['number'],
  message: string
) {
  return github.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,

    // eslint-disable-next-line @typescript-eslint/camelcase
    issue_number: prNumber,

    body: message,
  });
}
