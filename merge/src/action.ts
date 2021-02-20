import * as core from '@actions/core';
import { GitHub, context } from '@actions/github';
import { PullsGetResponse } from '@octokit/rest';

import { removePRLabel } from './label';
import { sendPRComment } from './comment';
import { delay } from './delay';

const RETRY_DELAY = 5000;

const hasLabel = (label: string, pull: PullsGetResponse) => {
  const { labels } = pull;

  return labels.find(currentLanel => currentLanel.name === label);
};

type MergeResult = 'done' | 'skip' | 'impossible' | 'need retry';
async function merge(
  github: GitHub,
  pullNumber: PullsGetResponse['number'],
  label: string | null
): Promise<MergeResult> {
  const response = await github.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,

    // eslint-disable-next-line @typescript-eslint/camelcase
    pull_number: pullNumber,
  });

  if (response.status !== 200) {
    throw new Error(
      `Cannot get pull request #${pullNumber}. Status ${response.status}.`
    );
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

  if (
    pull.mergeable_state === 'blocked' ||
    pull.mergeable_state === 'draft' ||
    pull.mergeable_state === 'behind'
  ) {
    console.log(`Mergeable state is ${pull.mergeable_state}. Stopping`);
    return 'skip';
  }

  const mergeResponse = await github.pulls.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,

    // eslint-disable-next-line @typescript-eslint/camelcase
    pull_number: pullNumber,
  });

  if (mergeResponse.status === 200) {
    return 'done';
  } else {
    throw new Error(
      `Failed to merge #${pullNumber}. Status ${mergeResponse.status}`
    );
  }
}

export async function run() {
  try {
    const githubToken = core.getInput('token', {
      required: true,
    });

    const pullNumber = parseInt(core.getInput('pullNumber'), 10);

    if (isNaN(pullNumber)) {
      throw Error('Cannot parse pull number');
    }

    const label = core.getInput('label') || null;

    const github = new GitHub(githubToken);

    let numberRetries = 1;
    let result: MergeResult = 'need retry';
    do {
      console.log(`Will try to merge pull request #${pullNumber}`);

      result = await merge(github, pullNumber, label);
      console.log(`Merge result is ${result}`);

      numberRetries++;

      await delay(RETRY_DELAY);
    } while (numberRetries < 21 && result === 'need retry');

    if (result !== 'done' && result !== 'skip') {
      console.log(`Failed to merge pull request #${pullNumber}`);

      if (label) {
        await removePRLabel(github, pullNumber, label);
        await sendPRComment(
          github,
          pullNumber,
          `Removing label ${label} because pull request is not mergeable `
        );
      }

      return;
    }

    if (result === 'done') {
      console.log(`Pull request #${pullNumber} merged`);
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}
