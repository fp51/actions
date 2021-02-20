import * as core from '@actions/core';
import { GitHub } from '@actions/github';

import { run } from './action';

jest.mock('@actions/core');
jest.mock('@actions/github');

const githubInstance = {
  search: {
    issuesAndPullRequests: jest.fn(),
  },
};

((GitHub as unknown) as jest.Mock).mockImplementation(function() {
  return githubInstance;
});

const branch = 'my-branch';
const githubToken = '13443245412324';
const owner = 'my-owner';
const repo = 'my-repo';
const fullRepo = `${owner}/${repo}`;

describe('action', () => {
  afterEach(() => {
    githubInstance.search.issuesAndPullRequests.mockRestore();
  });

  it('should fail if github response is not 200', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return branch;

        case 'token':
          return githubToken;

        case 'repository':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = fullRepo;
    process.env.GITHUB_REF = `refs/heads/toto`;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 400,
      data: {
        items: [],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith(
      'Search request error. Status 400'
    );
  });

  it('should search for pr with input branch and GITHUB_REPOSITORY', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return branch;

        case 'token':
          return githubToken;

        case 'repository':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = fullRepo;
    process.env.GITHUB_REF = `refs/heads/toto`;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: [],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).not.toHaveBeenCalledWith(expect.anything());

    const query = `repo:${fullRepo} is:pr head:${branch}`;

    expect(githubInstance.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: query,
      sort: 'updated',
      order: 'desc',
      // eslint-disable-next-line @typescript-eslint/camelcase
      per_page: 1,
    });
  });

  it('should search for pr with input branch as full ref and GITHUB_REPOSITORY', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return `refs/heads/${branch}`;

        case 'token':
          return githubToken;

        case 'repository':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = fullRepo;
    process.env.GITHUB_REF = `refs/heads/toto`;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: [],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).not.toHaveBeenCalledWith(expect.anything());

    const query = `repo:${fullRepo} is:pr head:${branch}`;

    expect(githubInstance.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: query,
      sort: 'updated',
      order: 'desc',
      // eslint-disable-next-line @typescript-eslint/camelcase
      per_page: 1,
    });
  });

  it('should search for pr with GITHUB_REF and GITHUB_REPOSITORY', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return '';

        case 'token':
          return githubToken;

        case 'repository':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = fullRepo;
    process.env.GITHUB_REF = `refs/heads/${branch}`;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: [],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).not.toHaveBeenCalledWith(expect.anything());

    const query = `repo:${fullRepo} is:pr head:${branch}`;

    expect(githubInstance.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: query,
      sort: 'updated',
      order: 'desc',
      // eslint-disable-next-line @typescript-eslint/camelcase
      per_page: 1,
    });
  });

  it('should search for pr with GITHUB_REF and repository input', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return '';

        case 'token':
          return githubToken;

        case 'repository':
          return fullRepo;

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = 'owner/toto';
    process.env.GITHUB_REF = `refs/heads/${branch}`;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: [],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).not.toHaveBeenCalledWith(expect.anything());

    const query = `repo:${fullRepo} is:pr head:${branch}`;

    expect(githubInstance.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: query,
      sort: 'updated',
      order: 'desc',
      // eslint-disable-next-line @typescript-eslint/camelcase
      per_page: 1,
    });
  });

  it('should set pullExists output to false if nothing found', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return '';

        case 'token':
          return githubToken;

        case 'repository':
          return fullRepo;

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = 'owner/toto';
    process.env.GITHUB_REF = `refs/heads/${branch}`;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: [],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).not.toHaveBeenCalledWith(expect.anything());

    expect(core.setOutput).toHaveBeenCalledWith('pullExists', 'false');
  });

  it('should set pullExists output to true and pullNumber', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return '';

        case 'token':
          return githubToken;

        case 'repository':
          return fullRepo;

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = 'owner/toto';
    process.env.GITHUB_REF = `refs/heads/${branch}`;

    const pullNumber = 11113244;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: [
          {
            number: pullNumber,
          },
        ],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).not.toHaveBeenCalledWith(expect.anything());

    expect(core.setOutput).toHaveBeenCalledWith('pullExists', 'true');
    expect(core.setOutput).toHaveBeenCalledWith('pullNumber', `${pullNumber}`);
  });

  it('should stop if no GITHUB_REF and no branch', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return '';

        case 'token':
          return githubToken;

        case 'repository':
          return fullRepo;

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = 'owner/toto';
    process.env.GITHUB_REF = '';

    const pullNumber = 11113244;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: [
          {
            number: pullNumber,
          },
        ],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith(
      'Missing GITHUB_REF and branch input. Cannot get branch info'
    );
  });

  it('should stop if no GITHUB_REPOSITORY', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'branch':
          return '';

        case 'token':
          return githubToken;

        case 'repository':
          return fullRepo;

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    process.env.GITHUB_REPOSITORY = '';
    process.env.GITHUB_REF = '';

    const pullNumber = 11113244;

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: [
          {
            number: pullNumber,
          },
        ],
      },
    });

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith(
      'Missing GITHUB_REPOSITORY env var'
    );
  });
});
