import * as core from '@actions/core';
import { PullsGetResponse } from '@octokit/rest';
import { GitHub } from '@actions/github';

// incomplete type for issuesAndPullRequests response that returns any
type SearchPRResponse = {
  id: PullsGetResponse['id'];
  number: PullsGetResponse['number'];
};

export async function run() {
  try {
    const githubToken = core.getInput('token', {
      required: true,
    });

    const defaultRepository = process.env.GITHUB_REPOSITORY || null;
    if (!defaultRepository) {
      throw new Error('Missing GITHUB_REPOSITORY env var');
    }

    const repository = core.getInput('repository') || defaultRepository;

    const currentRef = process.env.GITHUB_REF || null;

    const ref = core.getInput('branch') || currentRef;
    if (!ref) {
      throw new Error(
        'Missing GITHUB_REF and branch input. Cannot get branch info'
      );
    }

    // ref looks like refs/heads/my-branch
    // TODO could also be a tag (https://help.github.com/en/articles/virtual-environments-for-github-actions)
    // should we handle it here ?
    const branch = ref.replace('refs/heads/', '');
    console.log(`Trying to find pull request for branch ${branch}`);

    const github = new GitHub(githubToken);

    const query = `repo:${repository} is:pr head:${branch}`;

    const { status, data } = await github.search.issuesAndPullRequests({
      q: query,
      sort: 'updated',
      order: 'desc',
      // eslint-disable-next-line @typescript-eslint/camelcase
      per_page: 1,
    });

    if (status !== 200) {
      throw Error(`Search request error. Status ${status}`);
    }

    const { items } = data;
    const pulls = items as SearchPRResponse[];

    if (pulls.length === 0) {
      console.log('Found 0 pull request');

      core.setOutput('pullExists', 'false');
      core.setOutput('pullNumber', '-1');
      return;
    }

    const pullNumbers = pulls.map(pull => pull.number);
    console.log(
      `Found ${pullNumbers.length} pull requests: ${pullNumbers.join(', ')}`
    );

    const pullNumber = pullNumbers[0];

    core.setOutput('pullExists', 'true');
    core.setOutput('pullNumber', `${pullNumber}`);
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}
