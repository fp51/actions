import { GitHub, context } from '@actions/github';

import { searchForPullsToRebase } from './search';

jest.mock('@actions/github');

const githubInstance = {
  search: {
    issuesAndPullRequests: jest.fn(),
  },
};

describe('comment', () => {
  afterEach(() => {
    githubInstance.search.issuesAndPullRequests.mockRestore();
  });

  it('should call api to search pulls without label', async () => {
    const base = 'toto';
    const label = null;

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    context.repo = {
      owner: 'owner',
      repo: 'repo',
    };

    const pulls = [
      {
        number: 1,
      },
    ];

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: pulls,
      },
    });

    await expect(
      searchForPullsToRebase((githubInstance as unknown) as GitHub, base, label)
    ).resolves.toEqual(pulls);

    const baseQuery = `repo:${context.repo.owner}/${context.repo.repo} is:pr base:${base} state:open`;

    expect(githubInstance.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: baseQuery,
      sort: 'created',
      order: 'asc',

      // eslint-disable-next-line @typescript-eslint/camelcase
      per_page: 10,
    });
  });

  it('should call api to search pulls without label', async () => {
    const base = 'toto';
    const label = 'something: hello';

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    context.repo = {
      owner: 'owner',
      repo: 'repo',
    };

    const pulls = [
      {
        number: 1,
      },
    ];

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 200,
      data: {
        items: pulls,
      },
    });

    await expect(
      searchForPullsToRebase((githubInstance as unknown) as GitHub, base, label)
    ).resolves.toEqual(pulls);

    const query = `repo:${context.repo.owner}/${context.repo.repo} is:pr base:${base} state:open label:"${label}"`;

    expect(githubInstance.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: query,
      sort: 'created',
      order: 'asc',

      // eslint-disable-next-line @typescript-eslint/camelcase
      per_page: 10,
    });
  });

  it('should throw if api call fails', async () => {
    const base = 'toto';
    const label = 'something';

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    context.repo = {
      owner: 'owner',
      repo: 'repo',
    };

    const pulls = [
      {
        number: 1,
      },
    ];

    githubInstance.search.issuesAndPullRequests.mockResolvedValue({
      status: 300,
      data: {
        items: pulls,
      },
    });

    await expect(
      searchForPullsToRebase((githubInstance as unknown) as GitHub, base, label)
    ).rejects.toEqual(new Error(`Cannot search for pull requests. Code 300`));
  });
});
