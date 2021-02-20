import tmp from 'tmp';
import * as core from '@actions/core';
import { GitHub } from '@actions/github';
import { exec } from '@actions/exec';
import { PullsGetResponse } from '@octokit/rest';

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

(core.getInput as jest.Mock).mockImplementation((input: string) => {
  switch (input) {
    case 'token':
      return token;

    case 'base':
      return `refs/heads/${base}`;

    case 'label':
      return label;

    case 'onlyOne':
      return 'false';

    default:
      throw new Error('should not goes here in getInput mock');
  }
});

const gitInstance = {
  init: jest.fn(),
  checkout: jest.fn(),
  fetch: jest.fn(),
  rebase: jest.fn(),
  push: jest.fn(),
  currentSha: jest.fn(),
  currentBranch: jest.fn(),
};

(Git as jest.Mock).mockImplementation(() => gitInstance);

describe('action', () => {
  beforeEach(() => {
    ((tmp.dirSync as unknown) as jest.Mock).mockReset();
    ((exec as unknown) as jest.Mock).mockReset();
    (searchForPullsToRebase as jest.Mock).mockReset();
    Object.keys(gitInstance).forEach((key: string) => {
      gitInstance[key].mockReset();
    });
  });

  it('should search for pull requests', async () => {
    const tmpDir = {
      removeCallback: jest.fn(),
    };

    ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
    ((exec as unknown) as jest.Mock).mockResolvedValue(0);

    await expect(run()).resolves.toBeUndefined();

    expect(searchForPullsToRebase).toHaveBeenCalledWith(
      expect.anything(),
      base,
      label
    );
  });

  it('should fail if search for pull requests fails', async () => {
    const tmpDir = {
      removeCallback: jest.fn(),
    };

    ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
    ((exec as unknown) as jest.Mock).mockResolvedValue(0);
    (searchForPullsToRebase as jest.Mock).mockRejectedValue(
      new Error('search ko')
    );

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith('search ko');
  });

  it('should do nothing if no pull requests', async () => {
    const tmpDir = {
      removeCallback: jest.fn(),
    };

    const pulls = [];

    ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
    ((exec as unknown) as jest.Mock).mockResolvedValue(0);
    (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);

    await expect(run()).resolves.toBeUndefined();

    expect(rebasePullsWorkflow).not.toHaveBeenCalled();
  });

  it('should call rebasePullsWorkflow for pull requests', async () => {
    const tmpDir = {
      removeCallback: jest.fn(),
    };

    const pulls = [
      {
        number: 1,
      },
    ];

    ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
    ((exec as unknown) as jest.Mock).mockResolvedValue(0);
    (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);

    await expect(run()).resolves.toBeUndefined();

    expect(rebasePullsWorkflow).toHaveBeenCalledWith(
      expect.anything(),
      [1],
      false,
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should fails if rebasePullsWorkflow fails', async () => {
    const tmpDir = {
      removeCallback: jest.fn(),
    };

    const pulls = [
      {
        number: 1,
      },
    ];

    ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
    ((exec as unknown) as jest.Mock).mockResolvedValue(0);
    (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
    (rebasePullsWorkflow as jest.Mock).mockRejectedValue(
      new Error('rebase ko')
    );

    await expect(run()).resolves.toBeUndefined();

    expect(core.setFailed).toHaveBeenCalledWith('rebase ko');
  });

  describe('rebase a pull request', () => {
    const tmpDir = {
      name: '/path/tmp/dir',
      removeCallback: jest.fn(),
    };

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
      const tmpDir = {
        removeCallback: jest.fn(),
      };

      ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullsGetResponse['number'][],
          ___: boolean,
          rebase: RebaseCallback
        ) => {
          await rebase(pull as PullsGetResponse);
        }
      );

      await expect(run()).resolves.toBeUndefined();

      expect(tmp.dirSync).toHaveBeenCalled();
    });

    it('should always try to remove tmp directory', async () => {
      const tmpDir = {
        removeCallback: jest.fn(),
      };

      ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
      ((exec as unknown) as jest.Mock).mockImplementation(() => {
        throw new Error('KO');
      });
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullsGetResponse['number'][],
          ___: boolean,
          rebase: RebaseCallback
        ) => {
          await rebase(pull as PullsGetResponse);
        }
      );

      await expect(run()).resolves.toBeUndefined();

      expect(tmpDir.removeCallback).toHaveBeenCalled();
    });

    it('should checkout, rebase and push ', async () => {
      ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullsGetResponse['number'][],
          ___: boolean,
          rebase: RebaseCallback
        ) => {
          await rebase(pull as PullsGetResponse);
        }
      );

      gitInstance.currentSha.mockResolvedValue(pullHead.sha);
      gitInstance.currentBranch.mockResolvedValue(pullHead.ref);

      await expect(run()).resolves.toBeUndefined();

      expect(Git).toHaveBeenCalledWith(token, tmpDir.name);

      expect(gitInstance.init).toHaveBeenCalledWith();
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.currentSha).toHaveBeenCalledWith(
        `origin/${pullHead.ref}`
      );

      expect(gitInstance.checkout).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullBase.ref);

      expect(gitInstance.rebase).toHaveBeenCalledWith(`origin/${pullBase.ref}`);

      expect(gitInstance.currentBranch).toHaveBeenCalledWith();
      expect(gitInstance.push).toHaveBeenCalledWith();
    });

    it('should do nothing if sha changed', async () => {
      ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullsGetResponse['number'][],
          ___: boolean,
          rebase: RebaseCallback
        ) => {
          await rebase(pull as PullsGetResponse);
        }
      );

      gitInstance.currentSha.mockResolvedValue('another sha');
      gitInstance.currentBranch.mockResolvedValue(pullHead.ref);

      await expect(run()).resolves.toBeUndefined();

      expect(Git).toHaveBeenCalledWith(token, tmpDir.name);

      expect(gitInstance.init).toHaveBeenCalledWith();
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.currentSha).toHaveBeenCalledWith(
        `origin/${pullHead.ref}`
      );

      expect(gitInstance.checkout).not.toHaveBeenCalled();

      expect(gitInstance.rebase).not.toHaveBeenCalled();

      expect(gitInstance.currentBranch).not.toHaveBeenCalledWith();
      expect(gitInstance.push).not.toHaveBeenCalledWith();
    });

    it('should detect failed rebase', async () => {
      ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullsGetResponse['number'][],
          ___: boolean,
          rebase: RebaseCallback
        ) => {
          await rebase(pull as PullsGetResponse);
        }
      );

      gitInstance.currentSha.mockResolvedValue(pullHead.sha);
      gitInstance.currentBranch.mockResolvedValue(pullHead.ref);
      gitInstance.currentBranch.mockResolvedValue('not the good branch');

      await expect(run()).resolves.toBeUndefined();

      expect(Git).toHaveBeenCalledWith(token, tmpDir.name);

      expect(gitInstance.init).toHaveBeenCalledWith();
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.currentSha).toHaveBeenCalledWith(
        `origin/${pullHead.ref}`
      );

      expect(gitInstance.checkout).toHaveBeenCalled();

      expect(gitInstance.rebase).toHaveBeenCalled();

      expect(gitInstance.currentBranch).toHaveBeenCalledWith();

      expect(core.setFailed).toHaveBeenCalledWith(
        'Rebase did not end on the branch'
      );
    });

    it('should detect failed push', async () => {
      ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
      ((exec as unknown) as jest.Mock).mockResolvedValue(0);
      (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
      (rebasePullsWorkflow as jest.Mock).mockImplementation(
        async (
          _: GitHub,
          __: PullsGetResponse['number'][],
          ___: boolean,
          rebase: RebaseCallback
        ) => {
          await rebase(pull as PullsGetResponse);
        }
      );

      gitInstance.currentSha.mockResolvedValue(pullHead.sha);
      gitInstance.currentBranch.mockResolvedValue(pullHead.ref);
      gitInstance.push.mockRejectedValue(new Error('push ko'));

      await expect(run()).resolves.toBeUndefined();

      expect(Git).toHaveBeenCalledWith(token, tmpDir.name);

      expect(gitInstance.init).toHaveBeenCalledWith();
      expect(gitInstance.fetch).toHaveBeenCalledWith(pullHead.ref);
      expect(gitInstance.currentSha).toHaveBeenCalledWith(
        `origin/${pullHead.ref}`
      );

      expect(gitInstance.checkout).toHaveBeenCalled();

      expect(gitInstance.rebase).toHaveBeenCalled();

      expect(core.setFailed).toHaveBeenCalledWith('push ko');
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
        const tmpDir = {
          removeCallback: jest.fn(),
        };

        const pulls = [
          {
            number: 1,
          },
        ];

        ((tmp.dirSync as unknown) as jest.Mock).mockReturnValue(tmpDir);
        ((exec as unknown) as jest.Mock).mockResolvedValue(0);
        (searchForPullsToRebase as jest.Mock).mockResolvedValue(pulls);
        (rebasePullsWorkflow as jest.Mock).mockImplementation(
          async (
            _: GitHub,
            __: PullsGetResponse['number'][],
            ___: boolean,
            ____: RebaseCallback,
            onRebaseError: RebaseErrorCallback
          ) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            return onRebaseError(1, reason);
          }
        );

        await expect(run()).resolves.toBeUndefined();

        expect(sendPRComment).toHaveBeenCalledWith(
          expect.anything(),
          1,
          message
        );
        expect(removePRLabel).toHaveBeenCalled();
        expect(core.setFailed).not.toHaveBeenCalled();
      }
    );
  });
});
