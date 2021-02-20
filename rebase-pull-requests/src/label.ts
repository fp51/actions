import { GitHub, context } from '@actions/github';
import { PullsGetResponse } from '@octokit/rest';

export async function removePRLabel(
  github: GitHub,
  prNumber: PullsGetResponse['number'],
  label: string
) {
  return github.issues.removeLabel({
    owner: context.repo.owner,
    repo: context.repo.repo,

    // eslint-disable-next-line @typescript-eslint/camelcase
    issue_number: prNumber,

    name: label,
  });
}
