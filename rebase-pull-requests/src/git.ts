import { context } from '@actions/github';
import { exec } from '@actions/exec';

export function Git(token: string, user: { name: string; email: string }) {
  const url = `https://x-access-token:${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`;

  const execGit = async (
    args: string[],
    options: Parameters<typeof exec>[2] = {}
  ) => {
    const result = await exec('git', args, options);

    if (result !== 0) {
      throw new Error(`Command git ${args.join(' ')} failed`);
    }
  };

  const init = async () => {
    await execGit(['config', 'user.name', user.name]);
    await execGit(['config', 'user.email', user.email]);
    await execGit(['remote', 'set-url', 'origin', url]);
  };

  const checkout = (branch: string) => execGit(['checkout', branch]);

  const fetch = (branch: string) => execGit(['fetch', 'origin', branch]);

  const rebase = (ref: string) => execGit(['rebase', ref]);

  const currentSha = async (ref: string) => {
    let output = '';

    const listeners = {
      stdline: (data: string) => {
        output += data;
      },
    };

    await execGit(['rev-parse', ref], { listeners });

    return output.trim();
  };

  const push = () => execGit(['push', '--force-with-lease']);

  const currentBranch = async () => {
    let output = '';

    const listeners = {
      stdline: (data: string) => {
        output += data;
      },
    };

    await execGit(['branch', '--show-current'], {
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
