/**
 * Tests for the code generators (scripts/generate.mjs).
 *
 * The generator is a standalone Node ESM script with no testable exports,
 * so the tests spawn it with GENERATE_ROOT pointing at a temp directory and
 * assert the scaffolded file tree.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const GENERATOR = join(REPO_ROOT, 'scripts', 'generate.mjs');

const tempDirs: string[] = [];

function makeProjectRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'rsk-generate-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function runGenerator(
  root: string,
  args: string[],
): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [GENERATOR, ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, GENERATE_ROOT: root },
    encoding: 'utf8',
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/** Recursively list relative paths under a directory. */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        out.push(full.slice(dir.length + 1));
      }
    }
  };
  walk(dir);
  return out.sort();
}

describe('generate feature', () => {
  it('scaffolds the expected feature folder structure', () => {
    const root = makeProjectRoot();
    const { status, stderr } = runGenerator(root, ['feature', 'users']);

    expect(status, stderr).toBe(0);
    expect(listFiles(join(root, 'src', 'features', 'users'))).toEqual(
      expect.arrayContaining([
        'api/usersApi.ts',
        'components/.gitkeep',
        'hooks/useUsers.ts',
        'models/user.ts',
        'pages/UsersPage.tsx',
        'schemas/userSchemas.ts',
        'schemas/userFormSchemas.ts',
        'utils/userDisplay.ts',
      ]),
    );
  });

  it('pluralizes the model name from the feature name', () => {
    const root = makeProjectRoot();
    const { status, stderr } = runGenerator(root, ['feature', 'user-profiles']);

    expect(status, stderr).toBe(0);
    expect(
      existsSync(join(root, 'src', 'features', 'user-profiles', 'models', 'user-profile.ts')),
    ).toBe(true);
    expect(
      existsSync(join(root, 'src', 'features', 'user-profiles', 'api', 'userProfilesApi.ts')),
    ).toBe(true);
  });

  it('refuses to overwrite existing files', () => {
    const root = makeProjectRoot();
    runGenerator(root, ['feature', 'users']);
    const { status, stderr } = runGenerator(root, ['feature', 'users']);

    expect(status).toBe(1);
    expect(stderr).toContain('already exists');
  });
});

describe('generate component', () => {
  it('scaffolds a shared component with css, test and barrel', () => {
    const root = makeProjectRoot();
    const { status, stderr } = runGenerator(root, ['component', 'DataTable']);

    expect(status, stderr).toBe(0);
    const base = join(root, 'src', 'components', 'data-table');
    expect(listFiles(base)).toEqual(
      expect.arrayContaining([
        'DataTable.tsx',
        'DataTable.module.css',
        'DataTable.test.tsx',
        'index.ts',
      ]),
    );
    expect(readFileSync(join(base, 'index.ts'), 'utf8')).toContain(
      "export { DataTable, type DataTableProps } from './DataTable';",
    );
  });

  it('scaffolds a component inside a feature with --feature', () => {
    const root = makeProjectRoot();
    const { status, stderr } = runGenerator(root, ['component', 'UserTable', '--feature', 'users']);

    expect(status, stderr).toBe(0);
    const base = join(root, 'src', 'features', 'users', 'components');
    expect(existsSync(join(base, 'UserTable.tsx'))).toBe(true);
    expect(existsSync(join(base, 'UserTable.module.css'))).toBe(true);
    expect(existsSync(join(base, 'UserTable.test.tsx'))).toBe(true);
  });
});

describe('generate hook', () => {
  it('scaffolds a shared hook', () => {
    const root = makeProjectRoot();
    const { status, stderr } = runGenerator(root, ['hook', 'useUsers']);

    expect(status, stderr).toBe(0);
    expect(existsSync(join(root, 'src', 'hooks', 'useUsers.ts'))).toBe(true);
  });

  it('scaffolds a hook inside a feature with --feature', () => {
    const root = makeProjectRoot();
    const { status, stderr } = runGenerator(root, ['hook', 'useUsers', '--feature', 'users']);

    expect(status, stderr).toBe(0);
    expect(existsSync(join(root, 'src', 'features', 'users', 'hooks', 'useUsers.ts'))).toBe(true);
  });
});

describe('generate api', () => {
  it('scaffolds the data layer (models + schemas + api)', () => {
    const root = makeProjectRoot();
    const { status, stderr } = runGenerator(root, ['api', 'users']);

    expect(status, stderr).toBe(0);
    expect(existsSync(join(root, 'src', 'features', 'users', 'api', 'usersApi.ts'))).toBe(true);
    expect(existsSync(join(root, 'src', 'features', 'users', 'schemas', 'userSchemas.ts'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'src', 'features', 'users', 'models', 'user.ts'))).toBe(true);
  });
});

describe('generate validation', () => {
  it('rejects invalid names', () => {
    const root = makeProjectRoot();
    const cases: [string, string][] = [
      ['feature', 'Widgets'],
      ['component', 'dataTable'],
      ['hook', 'Users'],
    ];
    for (const [type, name] of cases) {
      const { status, stderr } = runGenerator(root, [type, name]);
      expect(status, `${type} ${name}`).toBe(1);
      expect(stderr).toContain('invalid');
    }
  });

  it('prints usage without a command', () => {
    const root = makeProjectRoot();
    const { status, stdout } = runGenerator(root, []);
    expect(status).toBe(0);
    expect(stdout).toContain('npm run generate feature <name>');
  });
});
