import { context } from '@actions/github';

import { GitHub, PullGetResponse } from './github';

export async function removePRLabel(
  github: GitHub,
  prNumber: PullGetResponse['number'],
  label: string,
) {
  return github.issues.removeLabel({
    owner: context.repo.owner,
    repo: context.repo.repo,

    // eslint-disable-next-line camelcase
    issue_number: prNumber,

    name: label,
  });
}
