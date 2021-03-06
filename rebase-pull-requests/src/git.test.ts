import * as github from '@actions/github';
import { exec } from '@actions/exec';

import { Git } from './git';

const token = 'token';
const owner = 'facebook';
const repo = 'react';

jest.mock('@actions/exec');
jest.mock('@actions/github');

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
github.context = {
  repo: {
    owner,
    repo,
  },
};

const user = {
  name: 'Jean',
  email: 'jean@test.com',
};

describe('git', () => {
  const git = Git(token, user);

  beforeEach(() => {
    (exec as jest.Mock).mockResolvedValue(0);
  });

  it('should fail if exec return status code > 0', async () => {
    (exec as jest.Mock).mockResolvedValue(1);

    await expect(git.init()).rejects.toEqual(
      new Error(`Command git config user.name ${user.name} failed`),
    );
  });

  describe('init', () => {
    it('should config username and set origin url', async () => {
      await git.init();

      const url = `https://x-access-token:${token}@github.com/${github.context.repo.owner}/${github.context.repo.repo}.git`;

      expect(exec).toHaveBeenCalledTimes(3);

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['config', 'user.name', user.name],
        expect.anything(),
      );

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['config', 'user.email', user.email],
        expect.anything(),
      );

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['remote', 'set-url', 'origin', url],
        expect.anything(),
      );
    });
  });

  describe('fetch', () => {
    it('should fetch origin branch', async () => {
      const branch = 'toto';
      await git.fetch(branch);

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['fetch', 'origin', branch],
        expect.anything(),
      );
    });
  });

  describe('checkout', () => {
    it('should checkout origin branch', async () => {
      const branch = 'toto';
      await git.checkout(branch);

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['checkout', branch],
        expect.anything(),
      );
    });
  });

  describe('rebase', () => {
    it('should rebase origin branch', async () => {
      const branch = 'toto';
      await git.rebase(branch);

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['rebase', branch],
        expect.anything(),
      );
    });
  });

  describe('currentSha', () => {
    it('should return current commit id', async () => {
      const commitSha = '12432134123444';
      const ref = 'refs/heads/master';

      (exec as jest.Mock).mockImplementation(
        (
          _: string,
          __: [],
          options: { listeners: { stdline: (data: string) => void } },
        ) => {
          options.listeners.stdline(commitSha);
          options.listeners.stdline('\n');
          return 0;
        },
      );

      const result = await git.currentSha(ref);

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['rev-parse', ref],
        expect.anything(),
      );
      expect(result).toEqual(commitSha);
    });
  });

  describe('push', () => {
    it('should push', async () => {
      await git.push();

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['push', '--force-with-lease'],
        expect.anything(),
      );
    });
  });

  describe('currentBranch', () => {
    it('should return current commit id', async () => {
      const branch = 'master';

      (exec as jest.Mock).mockImplementation(
        (
          _: string,
          __: [],
          options: { listeners: { stdline: (data: string) => void } },
        ) => {
          options.listeners.stdline(branch);
          options.listeners.stdline('\n');
          return 0;
        },
      );

      const result = await git.currentBranch();

      expect(exec).toHaveBeenCalledWith(
        'git',
        ['branch', '--show-current'],
        expect.anything(),
      );
      expect(result).toEqual(branch);
    });
  });
});
