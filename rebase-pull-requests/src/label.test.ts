import { context } from '@actions/github';

import { GitHub } from './github';

import { removePRLabel } from './label';

jest.mock('@actions/github');

const githubInstance = {
  issues: {
    removeLabel: jest.fn(),
  },
};

describe('label', () => {
  afterEach(() => {
    githubInstance.issues.removeLabel.mockRestore();
  });

  it('should call api to remove label', async () => {
    const prNumber = 12;
    const label = 'toto';

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    context.repo = {
      owner: 'owner',
      repo: 'repo',
    };

    await expect(
      removePRLabel((githubInstance as unknown) as GitHub, prNumber, label)
    ).resolves.toBeUndefined();

    expect(githubInstance.issues.removeLabel).toHaveBeenCalledWith({
      owner: context.repo.owner,
      repo: context.repo.repo,

      issue_number: prNumber,

      name: label,
    });
  });
});
