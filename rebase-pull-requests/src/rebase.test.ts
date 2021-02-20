import { GitHub, context } from '@actions/github';
import { rebasePullsWorkflow } from './rebase';

jest.mock('@actions/github');

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
context.repo = {
  owner: 'owner',
  repo: 'repo',
};

const github = ({
  pulls: {
    get: jest.fn(),
  },
} as unknown) as GitHub;

describe('rebase', () => {
  afterEach(() => {
    ((github.pulls.get as unknown) as jest.Mock).mockReset();
  });

  it('should try to fetch pull and stop if no 200', async () => {
    const pullNumbers = [1];
    const onRebase = jest.fn();
    const onRebaseError = jest.fn();

    ((github.pulls.get as unknown) as jest.Mock).mockResolvedValue({
      status: 404,
    });

    await expect(
      rebasePullsWorkflow(github, pullNumbers, false, onRebase, onRebaseError)
    ).rejects.toEqual(new Error(`Can't get pull 1. Status 404.`));

    expect(github.pulls.get).toHaveBeenCalledTimes(1);
    expect(onRebase).not.toHaveBeenCalled();
    expect(onRebaseError).not.toHaveBeenCalled();
  });

  it('should try to fetch pull and stop if not opened', async () => {
    const pullNumbers = [1];
    const onRebase = jest.fn();
    const onRebaseError = jest.fn();

    const pull = {
      state: 'merged',
    };

    ((github.pulls.get as unknown) as jest.Mock).mockResolvedValue({
      status: 200,
      data: pull,
    });

    await expect(
      rebasePullsWorkflow(github, pullNumbers, false, onRebase, onRebaseError)
    ).resolves.toBeUndefined();

    expect(onRebase).not.toHaveBeenCalled();
    expect(onRebaseError).not.toHaveBeenCalled();
  });

  it('should try to fetch pull and stop if mergeable_state !== clean', async () => {
    const pullNumbers = [1];
    const onRebase = jest.fn();
    const onRebaseError = jest.fn();

    const pull = {
      state: 'open',
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'clean',
    };

    ((github.pulls.get as unknown) as jest.Mock).mockResolvedValue({
      status: 200,
      data: pull,
    });

    await expect(
      rebasePullsWorkflow(github, pullNumbers, false, onRebase, onRebaseError)
    ).resolves.toBeUndefined();

    expect(onRebase).not.toHaveBeenCalled();
    expect(onRebaseError).not.toHaveBeenCalled();
  });

  it('should try to fetch pull and fail rebase if mergeable is false', async () => {
    const pullNumbers = [1];
    const onRebase = jest.fn();
    const onRebaseError = jest.fn();

    const pull = {
      state: 'open',
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'behind',
      mergeable: false,
    };

    ((github.pulls.get as unknown) as jest.Mock).mockResolvedValue({
      status: 200,
      data: pull,
    });

    await expect(
      rebasePullsWorkflow(github, pullNumbers, false, onRebase, onRebaseError)
    ).resolves.toBeUndefined();

    expect(onRebase).not.toHaveBeenCalled();
    expect(onRebaseError).toHaveBeenCalledWith(1, 'not mergeable');
  });

  it('should try to fetch pull and fail rebase if rebaseable is false', async () => {
    const pullNumbers = [1];
    const onRebase = jest.fn();
    const onRebaseError = jest.fn();

    const pull = {
      state: 'open',
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'behind',
      mergeable: null,
      rebaseable: false,
    };

    ((github.pulls.get as unknown) as jest.Mock).mockResolvedValue({
      status: 200,
      data: pull,
    });

    await expect(
      rebasePullsWorkflow(github, pullNumbers, false, onRebase, onRebaseError)
    ).resolves.toBeUndefined();

    expect(onRebase).not.toHaveBeenCalled();
    expect(onRebaseError).toHaveBeenCalledWith(1, 'not rebaseable');
  });

  it('should try to fetch pulls and rebase two times', async () => {
    const pullNumbers = [1, 2];
    const onRebase = jest.fn();
    const onRebaseError = jest.fn();

    const pull = {
      state: 'open',
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'behind',
      mergeable: null,
      rebaseable: true,
    };

    ((github.pulls.get as unknown) as jest.Mock).mockResolvedValue({
      status: 200,
      data: pull,
    });

    await expect(
      rebasePullsWorkflow(github, pullNumbers, false, onRebase, onRebaseError)
    ).resolves.toBeUndefined();

    expect(onRebase).toHaveBeenCalledTimes(2);
    expect(onRebaseError).not.toHaveBeenCalled();
  });

  it('should try to fetch pulls and rebase once because onlyOne', async () => {
    const pullNumbers = [1, 2];
    const onRebase = jest.fn();
    const onRebaseError = jest.fn();

    const pull = {
      state: 'open',
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'behind',
      mergeable: null,
      rebaseable: true,
    };

    ((github.pulls.get as unknown) as jest.Mock).mockResolvedValue({
      status: 200,
      data: pull,
    });

    await expect(
      rebasePullsWorkflow(github, pullNumbers, true, onRebase, onRebaseError)
    ).resolves.toBeUndefined();

    expect(onRebase).toHaveBeenCalledTimes(1);
    expect(onRebaseError).not.toHaveBeenCalled();
  });

  it('should handle rebase error', async () => {
    const pullNumbers = [1];
    const onRebase = jest.fn().mockRejectedValue(new Error('rebase error'));
    const onRebaseError = jest.fn();

    const pull = {
      state: 'open',
      // eslint-disable-next-line @typescript-eslint/camelcase
      mergeable_state: 'behind',
      mergeable: null,
      rebaseable: true,
      head: {
        ref: 'toto',
      },
    };

    ((github.pulls.get as unknown) as jest.Mock).mockResolvedValue({
      status: 200,
      data: pull,
    });

    await expect(
      rebasePullsWorkflow(github, pullNumbers, false, onRebase, onRebaseError)
    ).resolves.toBeUndefined();

    expect(onRebase).toHaveBeenCalled();
    expect(onRebaseError).toHaveBeenCalled();
  });
});
