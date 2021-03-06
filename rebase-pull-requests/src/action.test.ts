import tmp from 'tmp';
import * as core from '@actions/core';
import { exec } from '@actions/exec';

import { GitHub, PullGetResponse } from './github';

import { searchForPullsToRebase } from './search';
import {
  rebasePullsWorkflow,
  RebaseCallback,
  RebaseErrorCallback,
} from './rebase';
import { Git } from './git';
import { sendPRComment } from './comment';
import { removePRLabel } from './label';

import { run } from './action';

jest.mock('tmp');
jest.mock('@actions/core');
jest.mock('@actions/exec');

jest.mock('./search');
jest.mock('./rebase');
jest.mock('./git');
jest.mock('./label');
jest.mock('./comment');

const token = '1234143';
const head = 'head-branch';
const base = 'toto-branch';
const label = 'my-label';

const user = {
  name: 'Jean',
  email: 'jean@test.com',
};

process.chdir = jest.fn();

const gitInstance = {
  init: jest.fn(),
  checkout: jest.fn(),
  fetch: jest.fn(),
  rebase: jest.fn(),
  push: jest.fn(),
  currentSha: jest.fn(),
  currentBranch: jest.fn(),
};

describe('action', () => {
  const getInput = (input: string) => {
    switch (input) {
      case 'token':
        return token;

      case 'base':
        return `refs/heads/${base}`;

      case 'label':
        return label;

      case 'prNumber':
        return '';

      case 'gitUserName':
        return 'Jean';

      case 'gitUserEmail':
        return 'jean@test.com';

      default:
        throw new Error('should not goes here in getInput mock');
    }
  };
  (core.getInput as jest.Mock).mockImplementation(getInput);

  beforeEach(() => {
    ((tmp.dirSync as unknown) as jest.Mock)
      .mockReset()
      .mockReturnValue({ name: 'acbd' });
    (Git as jest.Mock).mockReset().mockImplementation(() => gitInstance);
    ((exec as unknown) as jest.Mock).mockReset();
    (searchForPullsToRebase as jest.Mock).mockReset();
    (process.chdir as jest.Mock).mockReset();

    Object.keys(gitInstance).forEach((key: string) => {
      gitInstance[key].mockReset();
    });
  });

  it('should search for pull requests', async () => {
    ((exec as unknown) as jest.Mock).mockResolvedValue(0);

    await expect(run()).resolves.toBeUndefined();

    expect(searchForPullsToRebase).toHaveBeenCalledWith(
      expect.anything(),
      base,
      label,
    );
  });

  it('should fail if search for pull requests fails', async () => {
    ((exec as unknown) as jest.Mock).mockResolvedValue(0);
    (searchForPullsToRebase as jest.Mock).mockRejectedValue(
      new Error('search ko'),
    );

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith('search ko');
  });

  it('should do nothing if no pull requests', async () => {
    const pulls = [];

    ((exec as unknown) as jest.Mock).mockResolvedValue(0);
    (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);

    await expect(run()).resolves.toBeUndefined();

    expect(rebasePullsWorkflow).not.toHaveBeenCalled();
  });

  it('should call rebasePullsWorkflow for pull requests', async () => {
    const pulls = [
      {
        number: 1,
      },
    ];

    ((exec as unknown) as jest.Mock).mockResolvedValue(0);
    (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);

    await expect(run()).resolves.toBeUndefined();

    expect(rebasePullsWorkflow).toHaveBeenCalledWith(
      expect.anything(),
      [1],
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('should fails if rebasePullsWorkflow fails', async () => {
    const pulls = [
      {
        number: 1,
      },
    ];

    ((exec as unknown) as jest.Mock).mockResolvedValue(0);
    (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
    (rebasePullsWorkflow as jest.Mock).mockRejectedValue(
      new Error('rebase ko'),
    );

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith('rebase ko');
  });

  describe('rebase a pull request', () => {
    const getInputWithoutPullNumber = (input: string) => {
      switch (input) {
        case 'token':
          return token;

        case 'base':
          return `refs/heads/${base}`;

        case 'label':
          return label;

        case 'prNumber':
          return '';

        case 'gitUserName':
          return 'Jean';

        case 'gitUserEmail':
          return 'jean@test.com';

        default:
          throw new Error('should not goes here in getInput mock');
      }
    };

    beforeEach(() => {
      (core.getInput as jest.Mock).mockImplementation(
        getInputWithoutPullNumber,
      );
    });

    const pulls = [
      {
        number: 1,
      },
    ];

    const sha = '123443';

    const pullBase = {
      ref: base,
    };

    const pullHead = {
      ref: head,
      sha,
    };

    const pull = {
      base: pullBase,
      head: pullHead,
    };

    it('should create a tmp directory and copy the current directory', async () => {
      const tmpDirName = '/tmp/safhjsdldfhj';
      (tmp.dirSync as jest.Mock).mockReturnValue({ name: tmpDirName });
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullGetResponse['number'][],
          rebase: RebaseCallback,
        ) => {
          await rebase(pull as PullGetResponse);
        },
      );

      await expect(run()).resolves.toBeUndefined();

      expect(tmp.dirSync).toHaveBeenCalledTimes(1);
      expect(process.chdir).toHaveBeenCalledWith(tmpDirName);
    });

    it('should always try to remove tmp directory', async () => {
      const tmpDirName = '/tmp/safhjsdldfhj';
      (tmp.dirSync as jest.Mock).mockReturnValue({ name: tmpDirName });
      (Git as jest.Mock).mockImplementation(() => {
        throw new Error('KO');
      });
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullGetResponse['number'][],
          rebase: RebaseCallback,
        ) => {
          await rebase(pull as PullGetResponse);
        },
      );

      await expect(run()).resolves.toBeUndefined();
      expect(exec).toHaveBeenCalledWith('rm', ['-rf', tmpDirName]);
    });

    it('should checkout, rebase and push', async () => {
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullGetResponse['number'][],
          rebase: RebaseCallback,
        ) => {
          await rebase(pull as PullGetResponse);
        },
      );

      gitInstance.currentSha.mockResolvedValue(pullHead.sha);
      gitInstance.currentBranch.mockResolvedValue(pullHead.ref);

      await expect(run()).resolves.toBeUndefined();

      expect(Git).toHaveBeenCalledWith(token, user);

      expect(gitInstance.init).toHaveBeenCalledWith();
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.currentSha).toHaveBeenCalledWith(
        `origin/${pullHead.ref}`,
      );

      expect(gitInstance.checkout).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullBase.ref);

      expect(gitInstance.rebase).toHaveBeenCalledWith(`origin/${pullBase.ref}`);

      expect(gitInstance.currentBranch).toHaveBeenCalledWith();
      expect(gitInstance.push).toHaveBeenCalledWith();
    });

    it('should do nothing if sha changed', async () => {
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullGetResponse['number'][],
          rebase: RebaseCallback,
        ) => {
          await rebase(pull as PullGetResponse);
        },
      );

      gitInstance.currentSha.mockResolvedValue('another sha');
      gitInstance.currentBranch.mockResolvedValue(pullHead.ref);

      await expect(run()).resolves.toBeUndefined();

      expect(Git).toHaveBeenCalledWith(token, user);

      expect(gitInstance.init).toHaveBeenCalledWith();
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.currentSha).toHaveBeenCalledWith(
        `origin/${pullHead.ref}`,
      );

      expect(gitInstance.checkout).not.toHaveBeenCalled();

      expect(gitInstance.rebase).not.toHaveBeenCalled();

      expect(gitInstance.currentBranch).not.toHaveBeenCalledWith();
      expect(gitInstance.push).not.toHaveBeenCalledWith();
    });

    it('should detect failed rebase', async () => {
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullGetResponse['number'][],
          rebase: RebaseCallback,
        ) => {
          await rebase(pull as PullGetResponse);
        },
      );

      gitInstance.currentSha.mockResolvedValue(pullHead.sha);
      gitInstance.currentBranch.mockResolvedValue(pullHead.ref);
      gitInstance.currentBranch.mockResolvedValue('not the good branch');

      await expect(run()).resolves.toBeUndefined();

      expect(Git).toHaveBeenCalledWith(token, user);

      expect(gitInstance.init).toHaveBeenCalledWith();
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.currentSha).toHaveBeenCalledWith(
        `origin/${pullHead.ref}`,
      );

      expect(gitInstance.checkout).toHaveBeenCalledTimes(1);

      expect(gitInstance.rebase).toHaveBeenCalledTimes(1);

      expect(gitInstance.currentBranch).toHaveBeenCalledWith();

      expect(core.setFailed).toHaveBeenCalledWith(
        'Rebase did not end on the branch',
      );
    });

    it('should detect failed push', async () => {
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullGetResponse['number'][],
          rebase: RebaseCallback,
        ) => {
          await rebase(pull as PullGetResponse);
        },
      );

      gitInstance.currentSha.mockResolvedValue(pullHead.sha);
      gitInstance.currentBranch.mockResolvedValue(pullHead.ref);
      gitInstance.push.mockRejectedValue(new Error('push ko'));

      await expect(run()).resolves.toBeUndefined();

      expect(Git).toHaveBeenCalledWith(token, user);

      expect(gitInstance.init).toHaveBeenCalledWith();
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.currentSha).toHaveBeenCalledWith(
        `origin/${pullHead.ref}`,
      );

      expect(gitInstance.checkout).toHaveBeenCalledTimes(1);

      expect(gitInstance.rebase).toHaveBeenCalledTimes(1);

      expect(core.setFailed).toHaveBeenCalledWith('push ko');
    });
  });

  describe('should read pullNumber', () => {
    const getInputWithPrNumber = (input: string) => {
      switch (input) {
        case 'token':
          return token;

        case 'base':
          return `refs/heads/${base}`;

        case 'label':
          return label;

        case 'prNumber':
          return '1234';

        case 'gitUserName':
          return 'Jean';

        case 'gitUserEmail':
          return 'jean@test.com';

        default:
          throw new Error('should not goes here in getInput mock');
      }
    };

    beforeEach(() => {
      (core.getInput as jest.Mock).mockImplementation(getInputWithPrNumber);
    });

    const sha = '123443';

    const pullBase = {
      ref: base,
    };

    const pullHead = {
      ref: head,
      sha,
    };

    const pull = {
      base: pullBase,
      head: pullHead,
    };

    it('should create a tmp directory and copy the current directory', async () => {
      const tmpDirName = '/tmp/safhjsdldfhj';
      (tmp.dirSync as jest.Mock).mockReturnValue({ name: tmpDirName });
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue([]);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullGetResponse['number'][],
          rebase: RebaseCallback,
        ) => {
          await rebase(pull as PullGetResponse);
        },
      );

      await expect(run()).resolves.toBeUndefined();

      expect(searchForPullsToRebase).not.toHaveBeenCalled();

      expect(rebasePullsWorkflow).toHaveBeenCalledWith(
        expect.anything(),
        [1234],
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('handle rebase error', () => {
    it.each([
      ['unknown', expect.stringMatching('Unknown')],
      ['not mergeable', expect.stringMatching('mergeable')],
      ['not rebaseable', expect.stringMatching('rebaseable')],
      ['cannot rebase', expect.stringMatching('Can not rebase')],
    ])(
      'should fails if rebasePullsWorkflow fails for %s reason',
      async (reason: string, message: string) => {
        const pulls = [
          {
            number: 1,
          },
        ];

        ((exec as unknown) as jest.Mock).mockResolvedValue(0);
        (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
        (rebasePullsWorkflow as jest.Mock).mockImplementation(
          async (
            _: GitHub,
            __: PullGetResponse['number'][],
            ___: RebaseCallback,
            onRebaseError: RebaseErrorCallback,
          ) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return onRebaseError(1, reason);
          },
        );

        await expect(run()).resolves.toBeUndefined();

        expect(sendPRComment).toHaveBeenCalledWith(
          expect.anything(),
          1,
          message,
        );
        expect(removePRLabel).toHaveBeenCalledTimes(1);
        expect(core.setFailed).not.toHaveBeenCalled();
      },
    );
  });
});
