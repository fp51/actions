import fs from 'fs-extra';
import * as core from '@actions/core';
import { exec } from '@actions/exec';

import { run } from './action';

jest.mock('@actions/exec', () => ({
  exec: jest.fn().mockImplementation(() => {
    return Promise.resolve();
  }),
}));

jest.mock('fs-extra');

jest.mock('@actions/core');

describe('action', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.log = jest.fn();
  });

  afterAll(() => {
    // eslint-disable-next-line no-console
    (console.log as jest.Mock).mockRestore();
  });

  ((fs.readdir as unknown) as jest.Mock).mockImplementation(() =>
    Promise.resolve(['action1/', 'action2/', 'file.json']),
  );
  ((fs.statSync as unknown) as jest.Mock).mockImplementation(
    (path: string) => ({
      isDirectory: () => path.indexOf('.') < 0,
    }),
  );

  afterEach(() => {
    (exec as jest.Mock).mockReset();
  });

  describe('without build directory and without .gitignore', () => {
    it('should clean .gitignore, clean node_modules and install', async () => {
      ((fs.existsSync as unknown) as jest.Mock).mockImplementation(
        (file: string) => {
          if (file.indexOf('gitignore') > 0) {
            return false;
          }

          return true;
        },
      );

      ((core.getInput as unknown) as jest.Mock).mockImplementation(
        (input: string) => {
          switch (input) {
            case 'actions_directory':
              return 'actions/';

            case 'build_directory':
              return '';

            case 'install_command':
              return 'yarn install';

            case 'build_command':
              return 'yarn run build';

            default:
              throw new Error('Should not goes here in getInput mock');
          }
        },
      );

      await expect(run()).resolves.toBeUndefined();

      expect(exec).toHaveBeenCalledTimes(4);

      expect(exec).toHaveBeenNthCalledWith(1, 'rm', ['-rf', 'node_modules'], {
        cwd: 'actions/action1/',
      });

      expect(exec).toHaveBeenNthCalledWith(2, 'yarn install', [], {
        cwd: 'actions/action1/',
      });

      expect(exec).toHaveBeenNthCalledWith(3, 'rm', ['-rf', 'node_modules'], {
        cwd: 'actions/action2/',
      });

      expect(exec).toHaveBeenNthCalledWith(4, 'yarn install', [], {
        cwd: 'actions/action2/',
      });
    });
  });

  describe('without build directory', () => {
    it('should clean .gitignore, clean node_modules and install', async () => {
      ((fs.existsSync as unknown) as jest.Mock).mockReturnValue(true);

      ((core.getInput as unknown) as jest.Mock).mockImplementation(
        (input: string) => {
          switch (input) {
            case 'actions_directory':
              return 'actions/';

            case 'build_directory':
              return '';

            case 'install_command':
              return 'yarn install';

            case 'build_command':
              return 'yarn run build';

            default:
              throw new Error('Should not goes here in getInput mock');
          }
        },
      );

      await expect(run()).resolves.toBeUndefined();

      expect(exec).toHaveBeenCalledTimes(6);

      expect(exec).toHaveBeenNthCalledWith(1, 'sed', [
        '-i',
        '/node_modules/d',
        'actions/action1/.gitignore',
      ]);

      expect(exec).toHaveBeenNthCalledWith(2, 'rm', ['-rf', 'node_modules'], {
        cwd: 'actions/action1/',
      });

      expect(exec).toHaveBeenNthCalledWith(3, 'yarn install', [], {
        cwd: 'actions/action1/',
      });

      expect(exec).toHaveBeenNthCalledWith(4, 'sed', [
        '-i',
        '/node_modules/d',
        'actions/action2/.gitignore',
      ]);

      expect(exec).toHaveBeenNthCalledWith(5, 'rm', ['-rf', 'node_modules'], {
        cwd: 'actions/action2/',
      });

      expect(exec).toHaveBeenNthCalledWith(6, 'yarn install', [], {
        cwd: 'actions/action2/',
      });
    });
  });

  describe('with build directory', () => {
    it('should clean .gitignore, clean node_modules,clean build directory, install and build actions', async () => {
      ((fs.existsSync as unknown) as jest.Mock).mockReturnValue(true);

      ((core.getInput as unknown) as jest.Mock).mockImplementation(
        (input: string) => {
          switch (input) {
            case 'actions_directory':
              return 'actions/';

            case 'build_directory':
              return 'build';

            case 'install_command':
              return 'yarn install';

            case 'build_command':
              return 'yarn run build';

            default:
              throw new Error('Should not goes here in getInput mock');
          }
        },
      );

      await expect(run()).resolves.toBeUndefined();

      expect(exec).toHaveBeenCalledTimes(12);

      expect(exec).toHaveBeenNthCalledWith(1, 'sed', [
        '-i',
        '/node_modules/d',
        'actions/action1/.gitignore',
      ]);

      expect(exec).toHaveBeenNthCalledWith(2, 'sed', [
        '-i',
        '/build/d',
        'actions/action1/.gitignore',
      ]);

      expect(exec).toHaveBeenNthCalledWith(3, 'rm', ['-rf', 'node_modules'], {
        cwd: 'actions/action1/',
      });

      expect(exec).toHaveBeenNthCalledWith(4, 'yarn install', [], {
        cwd: 'actions/action1/',
      });

      expect(exec).toHaveBeenNthCalledWith(5, 'rm', ['-rf', 'build'], {
        cwd: 'actions/action1/',
      });

      expect(exec).toHaveBeenNthCalledWith(6, 'yarn run build', [], {
        cwd: 'actions/action1/',
      });

      expect(exec).toHaveBeenNthCalledWith(7, 'sed', [
        '-i',
        '/node_modules/d',
        'actions/action2/.gitignore',
      ]);

      expect(exec).toHaveBeenNthCalledWith(8, 'sed', [
        '-i',
        '/build/d',
        'actions/action2/.gitignore',
      ]);

      expect(exec).toHaveBeenNthCalledWith(9, 'rm', ['-rf', 'node_modules'], {
        cwd: 'actions/action2/',
      });

      expect(exec).toHaveBeenNthCalledWith(10, 'yarn install', [], {
        cwd: 'actions/action2/',
      });

      expect(exec).toHaveBeenNthCalledWith(11, 'rm', ['-rf', 'build'], {
        cwd: 'actions/action2/',
      });

      expect(exec).toHaveBeenNthCalledWith(12, 'yarn run build', [], {
        cwd: 'actions/action2/',
      });
    });
  });
});
