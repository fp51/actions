import { context } from '@actions/github';
import { exec } from '@actions/exec';

export function Git(token: string, directory: string) {
  const url = `https://x-access-token:${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`;

  console.log({ directory });

  const execOptions = {
    cwd: directory,
  };

  const execCommand = async (
    command: string,
    args: string[],
    options: Parameters<typeof exec>[2] = {}
  ) => {
    const result = await exec(command, args, { ...execOptions, ...options });

    if (result !== 0) {
      throw new Error(`Command ${command} ${args.join(' ')} failed`);
    }
  };

  const init = async () => {
    await execCommand('git', [
      'config',
      '--global',
      'user.name',
      '"Rebase Action"',
    ]);
    await execCommand('git', ['remote', 'set-url', 'origin', url]);
  };

  const checkout = (branch: string) => execCommand('git', ['checkout', branch]);

  const fetch = (branch: string) =>
    execCommand('git', ['fetch', 'origin', branch]);

  const rebase = (ref: string) => execCommand('git', ['rebase', ref]);

  const currentSha = async (ref: string) => {
    let output = '';

    const listeners = {
      stdline: (data: string) => {
        output += data;
      },
    };

    await execCommand(`git`, ['rev-parse', ref], { listeners });

    return output.trim();
  };

  const push = () => execCommand('git', ['push', '--force-with-lease']);

  const currentBranch = async () => {
    let output = '';

    const listeners = {
      stdline: (data: string) => {
        output += data;
      },
    };

    await execCommand('git', ['branch', '--show-current'], {
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

// eslint-disable-next-line no-redeclare
export type Git = ReturnType<typeof Git>;
