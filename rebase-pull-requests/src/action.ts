import tmp from 'tmp';

import * as core from '@actions/core';
import { GitHub } from '@actions/github';
import { PullsGetResponse } from '@octokit/rest';
import { exec } from '@actions/exec';

import { searchForPullsToRebase } from './search';
import { rebasePullsWorkflow, RebaseErrorCallback } from './rebase';
import { Git } from './git';
import { sendPRComment } from './comment';
import { removePRLabel } from './label';

const buildErrorComment = (
  reason: Parameters<RebaseErrorCallback>[1]
): string => {
  switch (reason) {
    case 'not mergeable':
      return 'Skipping rebase because this pull request is not mergeable';

    case 'not rebaseable':
      return 'Skipping rebase because this pull request is not rebaseable';

    case 'cannot rebase':
      return 'Can not rebase the pull request';

    case 'unknown':
      return 'Ooops. Unknown error occurred during rebase.';
  }
};
async function checkoutRebaseAndPush(
  git: Git,
  pull: PullsGetResponse
): Promise<'nothing to do' | 'done'> {
  const { base, head } = pull;

  console.log('Init git');
  await git.init();

  console.log(`Fetch current head ${head.ref} branch`);
  await git.fetch(head.ref);

  console.log(`Retrieve up-to-date head sha for ${head.ref} branch`);
  const currentSha = await git.currentSha(`origin/${head.ref}`);
  console.log(`Up-to-date head sha is ${head.sha}`);
  console.log(`Local head sha is ${currentSha}`);

  if (head.sha !== currentSha) {
    console.log(
      `Pull request has been updated while running action. Skipping.`
    );
    return 'nothing to do';
  }

  console.log(`Checkout ${head.ref} branch`);
  await git.checkout(head.ref);

  console.log(`Fetch current base ${base.ref} branch`);
  await git.fetch(base.ref);

  console.log(`Rebasing ${head.ref} on ${base.ref}`);
  await git.rebase(`origin/${base.ref}`);

  const branchAfterRebase = await git.currentBranch();
  console.log('Current branch after rebase:', branchAfterRebase);

  if (branchAfterRebase !== head.ref) {
    // we're not on the branch after the rebase, rebase failed (conflict, etc.)
    throw new Error('Rebase did not end on the branch');
  }

  await git.push();

  return 'done';
}

export async function run() {
  try {
    const githubToken = core.getInput('token', {
      required: true,
    });

    const baseNameOrRef = core.getInput('base', {
      required: true,
    });

    const base = baseNameOrRef.replace('refs/heads/', '');

    const label = core.getInput('label') || null;
    const onlyOne = core.getInput('onlyOne') === 'true';

    const github = new GitHub(githubToken);

    const pulls = await searchForPullsToRebase(github, base, label);
    console.log(`${pulls.length} pull requests found`);

    if (pulls.length === 0) {
      console.log('Nothing to do');
      return;
    } else {
      const prNumbers = pulls.map(pr => pr.number);

      await rebasePullsWorkflow(
        github,
        prNumbers,
        onlyOne,
        async (pull: PullsGetResponse) => {
          let tmpDir: tmp.DirResult = {
            name: '',
            removeCallback: () => {},
          };

          try {
            tmpDir = tmp.dirSync();

            // copy the current directory somewhere to not affect the repo
            await exec('cp', ['-r', '.', tmpDir.name]);

            const git = Git(githubToken, tmpDir.name);

            return checkoutRebaseAndPush(git, pull);
          } finally {
            tmpDir && tmpDir.removeCallback();
          }
        },
        async (pullNumber, reason) => {
          if (label) {
            console.log(`Removing ${label} label for #${pullNumber}`);
            await removePRLabel(github, pullNumber, label);
          }

          console.log(`Comment on ${pullNumber}`);
          const comment = buildErrorComment(reason);
          await sendPRComment(github, pullNumber, comment);
        }
      );
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}
