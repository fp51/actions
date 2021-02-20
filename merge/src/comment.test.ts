import { GitHub, context } from '@actions/github';

import { sendPRComment } from './comment';

jest.mock('@actions/github');

const githubInstance = {
  issues: {
    createComment: jest.fn(),
  },
};

describe('comment', () => {
  afterEach(() => {
    githubInstance.issues.createComment.mockRestore();
  });

  it('should call api to send commend', async () => {
    const prNumber = 12;
    const comment = 'hello world';

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    context.repo = {
      owner: 'owner',
      repo: 'repo',
    };

    await expect(
      sendPRComment((githubInstance as unknown) as GitHub, prNumber, comment)
    ).resolves.toBeUndefined();

    expect(githubInstance.issues.createComment).toHaveBeenCalledWith({
      owner: context.repo.owner,
      repo: context.repo.repo,

      // eslint-disable-next-line @typescript-eslint/camelcase
      issue_number: prNumber,

      body: comment,
    });
  });
});
