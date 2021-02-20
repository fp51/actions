import * as core from '@actions/core';
import { GitHub, context } from '@actions/github';

import { removePRLabel } from './label';
import { sendPRComment } from './comment';

import { run } from './action';

jest.mock('@actions/core');
jest.mock('@actions/github');

jest.mock('./label');
jest.mock('./comment');

jest.mock('./delay', () => ({
  delay: () => Promise.resolve(),
}));

const githubInstance = {
  pulls: {
    get: jest.fn(),
    merge: jest.fn(),
  },
};

((GitHub as unknown) as jest.Mock).mockImplementation(function() {
  return githubInstance;
});

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
context.repo = {
  owner: 'org',
  repo: 'repoo-name',
};

const githubToken = '13443245412324';

describe('action', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log');
  });

  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
  });

  afterEach(() => {
    githubInstance.pulls.get.mockRestore();
    githubInstance.pulls.merge.mockRestore();

    ((core.setFailed as unknown) as jest.Mock).mockReset();

    (console.log as jest.Mock).mockReset();
  });

  it('should fail if cannot parse pullNumber', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return 'salut toi';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const response = {
      status: '400',
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith('Cannot parse pull number');

    expect(githubInstance.pulls.get).not.toHaveBeenCalled();
    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();
  });

  it('should fail if cannot get PR', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const response = {
      status: '400',
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith(
      `Cannot get pull request #12. Status ${response.status}.`
    );

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();
  });

  it('should stop if pr is open', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'closed',
      mergeable: true,
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should stop if pr is not mergeable', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: false,
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should stop if pr is not mergeable (mergeable_state is blocked)', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: true,
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'blocked',
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should stop if pr is not mergeable (mergeable_state is behind)', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: true,
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'behind',
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should stop if pr is not mergeable (mergeable_state is draft)', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: true,
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'draft',
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should stop if pr has not the required label', async () => {
    const label = 'my-label';

    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return label;

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: true,
      labels: [
        {
          name: 'not-my-label',
        },
      ],
      head: {
        ref: 'branch',
      },
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    await expect(run()).resolves.toBeUndefined();
    expect(core.setFailed).not.toHaveBeenCalled();

    expect(githubInstance.pulls.get).toHaveBeenCalled();

    expect(console.log).toHaveBeenCalledWith(
      `Pull request has no ${label} label. Stopping.`
    );

    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();
  });

  it('should continue if pr has the required label', async () => {
    const label = 'my-label';

    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return label;

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: true,
      labels: [
        {
          name: label,
        },
      ],
      head: {
        ref: 'branch',
      },
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    const mergeResponse = {
      status: 405,
    };

    githubInstance.pulls.merge.mockResolvedValue(mergeResponse);

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).toHaveBeenCalled();

    expect(core.setFailed).toHaveBeenCalledWith(expect.stringMatching('405'));
  });

  it('should handle impossible merge', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: true,
      head: {
        ref: 'branch',
      },
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    const mergeResponse = {
      status: 405,
    };

    githubInstance.pulls.merge.mockResolvedValue(mergeResponse);

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).toHaveBeenCalled();

    expect(core.setFailed).toHaveBeenCalledWith(
      `Failed to merge #12. Status ${mergeResponse.status}`
    );
  });

  it('should log successful merge', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: true,
      head: {
        ref: 'branch',
      },
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    const mergeResponse = {
      status: 200,
    };

    githubInstance.pulls.merge.mockResolvedValue(mergeResponse);

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalled();
    expect(githubInstance.pulls.merge).toHaveBeenCalled();

    expect(console.log).toHaveBeenCalledWith(`Pull request #12 merged`);

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should retry merge two times', async () => {
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return '';

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pullOne = {
      state: 'open',
      mergeable: null,
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'unknown',
      head: {
        ref: 'branch',
      },
    };

    const pullTwo = {
      state: 'open',
      mergeable: true,
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'unknown',
      head: {
        ref: 'branch',
      },
    };

    const responseOne = {
      status: 200,
      data: pullOne,
    };

    const responseTwo = {
      status: 200,
      data: pullTwo,
    };

    githubInstance.pulls.get
      .mockResolvedValueOnce(responseOne)
      .mockResolvedValueOnce(responseTwo);

    const mergeResponse = {
      status: 200,
    };

    githubInstance.pulls.merge.mockResolvedValue(mergeResponse);

    jest.useFakeTimers();

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalledTimes(2);
    expect(githubInstance.pulls.merge).toHaveBeenCalledTimes(1);

    expect(console.log).toHaveBeenCalledWith(`Pull request #12 merged`);

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should stop after 20 retries', async () => {
    const label = 'toto';
    (core.getInput as jest.Mock).mockImplementation((input: string): string => {
      switch (input) {
        case 'pullNumber':
          return '12';

        case 'token':
          return githubToken;

        case 'label':
          return label;

        default:
          throw new Error('should not go here in getInput mock');
      }
    });

    const pull = {
      state: 'open',
      mergeable: null,
      head: {
        ref: 'branch',
      },
      labels: [
        {
          name: label,
        },
      ],
    };

    const response = {
      status: 200,
      data: pull,
    };

    githubInstance.pulls.get.mockResolvedValue(response);

    const mergeResponse = {
      status: 200,
    };

    githubInstance.pulls.merge.mockResolvedValue(mergeResponse);

    jest.useFakeTimers();

    await expect(run()).resolves.toBeUndefined();

    expect(githubInstance.pulls.get).toHaveBeenCalledTimes(20);
    expect(githubInstance.pulls.merge).not.toHaveBeenCalled();

    expect(console.log).toHaveBeenCalledWith(
      `Failed to merge pull request #12`
    );

    expect(removePRLabel).toHaveBeenCalledTimes(1);
    expect(sendPRComment).toHaveBeenCalledTimes(1);

    expect(core.setFailed).not.toHaveBeenCalled();
  });
});
