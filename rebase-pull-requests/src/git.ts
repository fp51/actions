import { context } from '@actions/github';
import { exec } from '@actions/exec';

type Options = Parameters<typeof exec>[2];

const execCommand = async (command: string, options: Options) => {
  const result = await exec(command, [], options);

  if (result !== 0) {
    throw new Error(`Command ${command} failed`);
  }
};

export function Git(token: string, directory: string) {
  const url = `https://x-access-token:${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`;

  const execOptions = {
    cwd: directory,
  };

  const init = async () => {
    await execCommand(
      'git config --global user.name "Rebase Action"',
      execOptions
    );
    await execCommand(`git remote set-url origin ${url}`, execOptions);
  };

  const checkout = (branch: string) =>
    execCommand(`git checkout ${branch}`, execOptions);

  const fetch = (branch: string) =>
    execCommand(`git fetch origin ${branch}`, execOptions);

  const rebase = (ref: string) => execCommand(`git rebase ${ref}`, execOptions);

  const currentSha = async (ref: string) => {
    let output = '';

    const listeners = {
      stdline: (data: string) => {
        output += data;
      },
    };

    await execCommand(`git rev-parse ${ref}`, {
      ...execOptions,
      listeners,
    });

    return output.trim();
  };

  const push = () => execCommand(`git push --force-with-lease`, execOptions);

  const currentBranch = async () => {
    let output = '';

    const listeners = {
      stdline: (data: string) => {
        output += data;
      },
    };

    await execCommand('git branch --show-current', {
      ...execOptions,
      listeners,
    });

    return output.trim();
  };

  return {
    init,
    fetch,
    checkout,
    rebase,
    push,
    currentSha,
    currentBranch,
  };
}

export type Git = ReturnType<typeof Git>;
