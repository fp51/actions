import { GitHub, context } from '@actions/github';
import { PullsGetResponse } from '@octokit/rest';

type PRWorkflowResult = 'Rebased' | 'Cannot rebase' | 'Nothing to do';

export type RebaseCallback = (
  pull: PullsGetResponse
) => Promise<'done' | 'nothing to do'>;

export type RebaseErrorCallback = (
  pullNumber: PullsGetResponse['number'],
  reason: 'not mergeable' | 'not rebaseable' | 'cannot rebase' | 'unknown'
) => Promise<void>;

async function rebasePullWorkflow(
  github: GitHub,
  pullNumber: PullsGetResponse['number'],
  onRebase: RebaseCallback,
  onRebaseError: RebaseErrorCallback
): Promise<PRWorkflowResult> {
  const response = await github.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,

    // eslint-disable-next-line @typescript-eslint/camelcase
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
    console.log(
      `PR #${pullNumber} mergeable_state is clean. Nothing to do. Skipping.`
    );
    return 'Nothing to do';
  }

  try {
    // if PR is not mergeable, manual conflict resolution is required
    if (pull.mergeable === false) {
      console.log(`Pull request #${pullNumber} is not mergeable`);
      await onRebaseError(pullNumber, 'not mergeable');
      return 'Cannot rebase';
    }

    // if PR is not rebaseable, manual conflict resolution is required
    if (pull.rebaseable === false) {
      console.log(`Pull request #${pullNumber} is not rebaseable`);
      await onRebaseError(pullNumber, 'not rebaseable');
      return 'Cannot rebase';
    }

    const rebaseResult = await onRebase(pull);

    if (rebaseResult === 'nothing to do') {
      return 'Nothing to do';
    } else {
      return 'Rebased';
    }
  } catch (error) {
    const { head } = pull;

    console.log(`Unknown error rebasing ${head.ref} for PR ${pullNumber}`);
    console.error(error);

    await onRebaseError(pullNumber, 'unknown');

    return 'Cannot rebase';
  }
}

export async function rebasePullsWorkflow(
  github: GitHub,
  pullNumbers: PullsGetResponse['number'][],
  onlyFirstPulls: boolean,
  onRebase: RebaseCallback,
  onRebaseError: RebaseErrorCallback
) {
  let pullsIndex = 0;

  do {
    if (pullsIndex >= pullNumbers.length) {
      console.log('Nothing to rebase anymore');

      return;
    }

    const pullNumber = pullNumbers[pullsIndex];
    const result = await rebasePullWorkflow(
      github,
      pullNumber,
      onRebase,
      onRebaseError
    );

    if (result === 'Rebased') {
      console.log(`Pull #${pullNumber} rebased`);
    } else if (result === 'Nothing to do') {
      console.log(`Nothing to do for #${pullNumber}`);
    } else {
      console.log(`Cannot rebase #${pullNumber}`);
    }

    // stop after one pulls rebased if onlyFirstpulls is true
    if (onlyFirstPulls && result === 'Rebased') {
      return;
    }

    // try to rebase next pulls
    pullsIndex++;
  } while (true);
}
