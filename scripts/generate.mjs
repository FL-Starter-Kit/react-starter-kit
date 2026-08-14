#!/usr/bin/env node
/**
 * Code generators for the starter kit.
 *
 * Usage:
 *   npm run generate feature <name>                scaffold a feature module
 *   npm run generate component <Name>              scaffold a shared component
 *   npm run generate component <Name> --feature <f>  scaffold a feature component
 *   npm run generate hook use<Name>                scaffold a shared hook
 *   npm run generate hook use<Name> --feature <f>    scaffold a feature hook
 *   npm run generate api <name>                    scaffold a feature's data layer
 *
 * Examples:
 *   npm run generate feature users
 *   npm run generate component DataTable
 *   npm run generate hook useUsers
 *   npm run generate api users
 *
 * The generator never overwrites existing files — it fails with a clear
 * message instead. Set GENERATE_ROOT to write into a different project
 * (used by the generator's own tests).
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = process.env.GENERATE_ROOT ?? REPO_ROOT;
const SRC_DIR = join(PROJECT_ROOT, 'src');

const USAGE = `
Code generators for the starter kit.

Usage:
  npm run generate feature <name>
  npm run generate component <Name> [--feature <feature>]
  npm run generate hook use<Name> [--feature <feature>]
  npm run generate api <name>

Commands:
  feature    Scaffold src/features/<name>/ with api/, components/, hooks/,
             models/, pages/, schemas/ and utils/ skeletons.
  component  Scaffold a shared component (src/components/<name>/), or a
             feature component with --feature <feature>.
  hook       Scaffold a shared hook (src/hooks/use<Name>.ts), or a feature
             hook with --feature <feature>.
  api        Scaffold a feature's data layer (models + schemas + api).

Existing files are never overwritten.`;
const HELP_FLAGS = new Set(['--help', '-h', 'help']);

const FEATURE_RE = /^[a-z][a-z0-9-]*$/;
const COMPONENT_RE = /^[A-Z][A-Za-z0-9]*$/;
const HOOK_RE = /^use[A-Z][A-Za-z0-9]*$/;

function fail(message) {
  console.error(`error: ${message}`);
  console.error(USAGE);
  process.exit(1);
}

function singularize(word) {
  const lower = word.toLowerCase();
  if (lower.endsWith('ies')) {
    return `${word.slice(0, -3)}y`;
  }
  if (/(ses|xes|zes|ches|shes)$/.test(lower)) {
    return word.slice(0, -2);
  }
  if (
    lower.endsWith('s') &&
    !lower.endsWith('ss') &&
    !lower.endsWith('us') &&
    !lower.endsWith('is')
  ) {
    return word.slice(0, -1);
  }
  return word;
}

function pascalCase(str) {
  return str
    .split('-')
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join('');
}

function camelCase(str) {
  const pascal = pascalCase(str);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

function kebabSegments(feature) {
  const segments = feature.split('-').filter(Boolean);
  const lastIndex = segments.length - 1;
  segments[lastIndex] = singularize(segments[lastIndex]);
  return segments;
}

/**
 * Derive the naming vocabulary for a feature name:
 *   feature        user-profiles   (kebab, plural, as typed)
 *   featureCamel   userProfiles    (for object/hook/file names)
 *   Name           UserProfiles    (Pascal, for list hooks and pages)
 *   entity         userProfile     (camel, singular, for schema identifiers)
 *   Entity         UserProfile     (Pascal, singular, for type names)
 */
function namesForFeature(feature) {
  const entityKebab = kebabSegments(feature).join('-');
  return {
    feature,
    featureCamel: camelCase(feature),
    Name: pascalCase(feature),
    entity: camelCase(entityKebab),
    Entity: pascalCase(entityKebab),
    entityKebab,
  };
}

function formatWithPrettier(filePaths) {
  const prettierBin = join(REPO_ROOT, 'node_modules', '.bin', 'prettier');
  if (!existsSync(prettierBin)) {
    return;
  }
  const configPath = join(REPO_ROOT, 'prettier.config.js');
  spawnSync(
    prettierBin,
    ['--write', ...(existsSync(configPath) ? ['--config', configPath] : []), ...filePaths],
    {
      stdio: 'ignore',
      cwd: REPO_ROOT,
    },
  );
}

function writeFiles(files, { format = true } = {}) {
  const paths = [];
  for (const { path, content } of files) {
    if (existsSync(path)) {
      fail(`already exists: ${relative(PROJECT_ROOT, path)}`);
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, 'utf8');
    paths.push(path);
    console.log(`  created ${relative(PROJECT_ROOT, path)}`);
  }
  if (format) {
    formatWithPrettier(paths.filter((path) => basename(path) !== '.gitkeep'));
  }
}

/* ------------------------------------------------------------------ */
/* Templates                                                            */
/* ------------------------------------------------------------------ */

function modelTemplate({ entity, Entity, feature }) {
  return `/**
 * ${Entity} domain model.
 */

export interface ${Entity} {
  id: string;
  name: string;
  /** ISO 8601 UTC timestamps. */
  createdAt: string;
  updatedAt: string;
}

/**
 * List query expressed as URL search params by the page.
 * Optional fields carry \`| undefined\` so callers can explicitly clear
 * them (exactOptionalPropertyTypes-friendly).
 */
export interface ${Entity}ListQuery {
  page: number;
  pageSize: number;
  search?: string | undefined;
}

/** Payload for create/update ${entity} operations. */
export interface ${Entity}Input {
  name: string;
}
`;
}

function schemasTemplate({ entity, Entity }) {
  return `/**
 * Runtime validation schemas for the ${Entity} API.
 *
 * Server responses are validated at runtime (never trusted blindly) — a
 * contract breach fails the request loudly for developers while presenting
 * a generic error to users. The form schema lives in a separate file
 * because form values differ from wire payloads.
 */

import { z } from 'zod';

const timestampSchema = z.iso.datetime();

export const ${entity}Schema = z.object({
  id: z.string(),
  name: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Validated${Entity} = z.infer<typeof ${entity}Schema>;

export const ${entity}ListSchema = z.object({
  items: z.array(${entity}Schema),
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type Validated${Entity}List = z.infer<typeof ${entity}ListSchema>;

/** Wire payload for create/update. \`id\`/timestamps are server-owned. */
export const ${entity}InputSchema = z.object({
  name: z.string().min(1),
});

export type Validated${Entity}Input = z.infer<typeof ${entity}InputSchema>;

/**
 * URL search-param state for the ${entity} list page. Every field has a
 * deterministic fallback so malformed URLs degrade to safe defaults.
 */
export const ${entity}ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().positive().catch(10),
  search: z.string().min(1).optional().catch(undefined),
});

export type Validated${Entity}ListQuery = z.infer<typeof ${entity}ListQuerySchema>;
`;
}

function formSchemasTemplate({ entity, Entity }) {
  return `/**
 * Zod schema for the create/edit ${entity} FORM. Field shapes mirror the
 * API input schema but carry user-facing validation messages and trim rules.
 */

import { z } from 'zod';

export const ${entity}FormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.'),
});

export type ${Entity}FormValues = z.infer<typeof ${entity}FormSchema>;

export const empty${Entity}Form: ${Entity}FormValues = {
  name: '',
};
`;
}

function apiTemplate({ feature, featureCamel, entity, Entity }) {
  return `/**
 * ${Entity} API — typed, runtime-validated calls through the central HTTP
 * client. Features never call \`fetch\` directly.
 */

import type { ${Entity}ListQuery } from '@/features/${feature}/models/${entity}';
import {
  ${entity}InputSchema,
  ${entity}ListSchema,
  ${entity}Schema,
  type Validated${Entity},
  type Validated${Entity}Input,
  type Validated${Entity}List,
} from '@/features/${feature}/schemas/${entity}Schemas';
import { httpClient } from '@/lib/http';

export const ${featureCamel}Api = {
  /** Paginated, filterable ${feature} list. */
  list(query: ${Entity}ListQuery, signal?: AbortSignal): Promise<Validated${Entity}List> {
    return httpClient.get('/api/${feature}', {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
      },
      ...(signal !== undefined ? { signal } : {}),
      validate: (raw) => ${entity}ListSchema.parse(raw),
    });
  },

  /** Fetch a single ${entity}. */
  get(id: string, signal?: AbortSignal): Promise<Validated${Entity}> {
    return httpClient.get(\`/api/${feature}/\${id}\`, {
      ...(signal !== undefined ? { signal } : {}),
      validate: (raw) => ${entity}Schema.parse(raw),
    });
  },

  /** Create a ${entity}. */
  create(input: Validated${Entity}Input): Promise<Validated${Entity}> {
    return httpClient.post('/api/${feature}', ${entity}InputSchema.parse(input), {
      validate: (raw) => ${entity}Schema.parse(raw),
    });
  },

  /** Update a ${entity}. */
  update(id: string, input: Validated${Entity}Input): Promise<Validated${Entity}> {
    return httpClient.patch(\`/api/${feature}/\${id}\`, ${entity}InputSchema.parse(input), {
      validate: (raw) => ${entity}Schema.parse(raw),
    });
  },

  /** Delete a ${entity}. */
  remove(id: string): Promise<void> {
    return httpClient.delete(\`/api/${feature}/\${id}\`);
  },
};
`;
}

function hooksTemplate({ feature, featureCamel, entity, Entity, Name }) {
  return `/**
 * Server-state hooks for the ${Name} feature (TanStack Query).
 * UI state stays in components; URL state stays in the router; only
 * server data lives here.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ${featureCamel}Api } from '@/features/${feature}/api/${featureCamel}Api';
import type { ${Entity}ListQuery } from '@/features/${feature}/models/${entity}';
import type { Validated${Entity}Input } from '@/features/${feature}/schemas/${entity}Schemas';

export const ${featureCamel}QueryKeys = {
  all: ['${feature}'] as const,
  list: (query: ${Entity}ListQuery) => ['${feature}', 'list', query] as const,
  detail: (id: string) => ['${feature}', 'detail', id] as const,
};

/** Paginated ${feature} list; keeps the previous page visible while fetching. */
export function use${Name}(query: ${Entity}ListQuery) {
  return useQuery({
    queryKey: ${featureCamel}QueryKeys.list(query),
    queryFn: ({ signal }) => ${featureCamel}Api.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** Single ${entity} by id. */
export function use${Entity}(id: string | undefined) {
  return useQuery({
    queryKey: ${featureCamel}QueryKeys.detail(id ?? ''),
    queryFn: ({ signal }) =>
      id !== undefined ? ${featureCamel}Api.get(id, signal) : Promise.resolve(null),
    enabled: id !== undefined,
  });
}

function useInvalidate${Entity}() {
  const queryClient = useQueryClient();
  return {
    invalidateList: () => queryClient.invalidateQueries({ queryKey: ${featureCamel}QueryKeys.all }),
    setDetail: (entity: Awaited<ReturnType<typeof ${featureCamel}Api.get>>) =>
      queryClient.setQueryData(${featureCamel}QueryKeys.detail(entity.id), entity),
  };
}

export function useCreate${Entity}() {
  const { invalidateList, setDetail } = useInvalidate${Entity}();
  return useMutation({
    mutationFn: (input: Validated${Entity}Input) => ${featureCamel}Api.create(input),
    onSuccess: (entity) => {
      setDetail(entity);
      void invalidateList();
    },
  });
}

export function useUpdate${Entity}() {
  const { invalidateList, setDetail } = useInvalidate${Entity}();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Validated${Entity}Input }) =>
      ${featureCamel}Api.update(id, input),
    onSuccess: (entity) => {
      setDetail(entity);
      void invalidateList();
    },
  });
}

export function useDelete${Entity}() {
  const { invalidateList } = useInvalidate${Entity}();
  return useMutation({
    mutationFn: (id: string) => ${featureCamel}Api.remove(id),
    onSuccess: () => void invalidateList(),
  });
}
`;
}

function displayTemplate({ feature, entity, Entity, Name }) {
  return `/**
 * ${Name} feature display helpers. Pure functions kept out of components so
 * they are unit testable and reusable.
 */

import type { ${Entity} } from '@/features/${feature}/models/${entity}';

/** Initials for avatar placeholders, e.g. "Ada L". */
export function initials(record: Pick<${Entity}, 'name'>): string {
  return record.name
    .trim()
    .split(/\\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
`;
}

function pageTemplate({ feature, Name }) {
  return `import { PageHeader } from '@/components/layout/PageHeader';

/** ${Name} list page — compose feature components and server state here. */
export function ${Name}Page() {
  return <PageHeader title="${Name}" description="Manage ${feature}." />;
}
`;
}

function componentTemplate({ Name }) {
  return `import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/utils/cn';

import styles from './${Name}.module.css';

export interface ${Name}Props extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

/** ${Name} — replace with a short description. */
export function ${Name}({ className, children, ...rest }: ${Name}Props) {
  return (
    <div className={cn(styles.root, className)} {...rest}>
      {children}
    </div>
  );
}
`;
}

function componentCssTemplate() {
  return `.root {
  display: block;
}
`;
}

function componentTestTemplate({ Name }) {
  return `import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ${Name} } from './${Name}';

describe('${Name}', () => {
  it('renders children', () => {
    render(<${Name}>Hello</${Name}>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
`;
}

function componentIndexTemplate({ Name }) {
  return `export { ${Name}, type ${Name}Props } from './${Name}';
`;
}

function hookTemplate({ hookName }) {
  const camel = camelCase(hookName.replace(/^use/, ''));
  return `import { useState } from 'react';

/**
 * ${hookName} — replace with a short description.
 */
export function ${hookName}() {
  const [state, setState] = useState<string | null>(null);

  return { state, setState };
}
`;
}

/* ------------------------------------------------------------------ */
/* Generators                                                           */
/* ------------------------------------------------------------------ */

function generateDataLayer(names) {
  const { feature, featureCamel, entity, entityKebab } = names;
  return [
    {
      path: join(SRC_DIR, 'features', feature, 'models', `${entityKebab}.ts`),
      content: modelTemplate(names),
    },
    {
      path: join(SRC_DIR, 'features', feature, 'schemas', `${entityKebab}Schemas.ts`),
      content: schemasTemplate(names),
    },
    {
      path: join(SRC_DIR, 'features', feature, 'schemas', `${entityKebab}FormSchemas.ts`),
      content: formSchemasTemplate(names),
    },
    {
      path: join(SRC_DIR, 'features', feature, 'api', `${featureCamel}Api.ts`),
      content: apiTemplate(names),
    },
  ];
}

function generateFeature(feature) {
  if (!FEATURE_RE.test(feature)) {
    fail(
      `invalid feature name "${feature}" — use lowercase kebab-case, e.g. "users" or "user-profiles"`,
    );
  }
  const names = namesForFeature(feature);
  const { featureCamel, entity, Name } = names;
  const files = [
    ...generateDataLayer(names),
    {
      path: join(SRC_DIR, 'features', feature, 'hooks', `use${Name}.ts`),
      content: hooksTemplate(names),
    },
    {
      path: join(SRC_DIR, 'features', feature, 'utils', `${entity}Display.ts`),
      content: displayTemplate(names),
    },
    {
      path: join(SRC_DIR, 'features', feature, 'pages', `${Name}Page.tsx`),
      content: pageTemplate(names),
    },
    {
      path: join(SRC_DIR, 'features', feature, 'components', '.gitkeep'),
      content: '',
    },
  ];

  console.log(`\nScaffolding feature "${feature}":`);
  writeFiles(files);
  console.log(`
Next steps:
  1. Define real fields in models/${entity}.ts and mirror them in
     schemas/${entity}Schemas.ts / ${entity}FormSchemas.ts.
  2. Wire the route in src/app/router/routes.tsx (lazy page import).
  3. Add MSW handlers for /api/${feature} following the examples/users-crud/mocks pattern and
     register them in src/tests/mocks/node.ts and src/tests/mocks/browser.ts.
  4. Add tests following the users feature conventions (docs/TESTING.md).`);
}

function generateComponent(name, feature) {
  if (!COMPONENT_RE.test(name)) {
    fail(`invalid component name "${name}" — use PascalCase, e.g. "DataTable"`);
  }
  const kebab = name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
  const files = [
    {
      path: join(SRC_DIR, 'components', kebab, `${name}.tsx`),
      content: componentTemplate({ Name: name }),
    },
    {
      path: join(SRC_DIR, 'components', kebab, `${name}.module.css`),
      content: componentCssTemplate(),
    },
    {
      path: join(SRC_DIR, 'components', kebab, `${name}.test.tsx`),
      content: componentTestTemplate({ Name: name }),
    },
    {
      path: join(SRC_DIR, 'components', kebab, 'index.ts'),
      content: componentIndexTemplate({ Name: name }),
    },
  ];

  console.log(`\nScaffolding component "${name}":`);
  writeFiles(files);
  console.log(`
Next steps:
  1. Replace the placeholder markup and props in components/${kebab}/${name}.tsx.
  2. Keep the test green and add an axe check (docs/TESTING.md §3).`);
}

function generateFeatureComponent(name, feature) {
  if (!COMPONENT_RE.test(name)) {
    fail(`invalid component name "${name}" — use PascalCase, e.g. "DataTable"`);
  }
  const files = [
    {
      path: join(SRC_DIR, 'features', feature, 'components', `${name}.tsx`),
      content: componentTemplate({ Name: name }),
    },
    {
      path: join(SRC_DIR, 'features', feature, 'components', `${name}.module.css`),
      content: componentCssTemplate(),
    },
    {
      path: join(SRC_DIR, 'features', feature, 'components', `${name}.test.tsx`),
      content: componentTestTemplate({ Name: name }),
    },
  ];

  console.log(`\nScaffolding feature component "${name}" in "${feature}":`);
  writeFiles(files);
}

function generateHook(hookName, feature) {
  if (!HOOK_RE.test(hookName)) {
    fail(`invalid hook name "${hookName}" — must start with "use", e.g. "useUsers"`);
  }
  const targetDir = feature ? join(SRC_DIR, 'features', feature, 'hooks') : join(SRC_DIR, 'hooks');
  const path = join(targetDir, `${hookName}.ts`);

  console.log(`\nScaffolding hook "${hookName}":`);
  writeFiles([{ path, content: hookTemplate({ hookName }) }]);
  console.log(`
Next steps:
  1. Replace the placeholder state with the hook's real logic.
  2. Add a unit test next to it if the logic is non-trivial.`);
}

function generateApi(feature) {
  if (!FEATURE_RE.test(feature)) {
    fail(
      `invalid feature name "${feature}" — use lowercase kebab-case, e.g. "users" or "user-profiles"`,
    );
  }
  const names = namesForFeature(feature);
  console.log(`\nScaffolding data layer for feature "${feature}":`);
  writeFiles(generateDataLayer(names));
  console.log(`
Next steps:
  1. Add MSW handlers for /api/${feature} following the examples/users-crud/mocks pattern and
     register them in src/tests/mocks/node.ts and src/tests/mocks/browser.ts.
  2. Generate the rest of the feature with "npm run generate feature ${feature}" if needed.`);
}

/* ------------------------------------------------------------------ */
/* CLI                                                                  */
/* ------------------------------------------------------------------ */

function parseFlags(args) {
  const flags = { feature: undefined };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--feature') {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('-')) {
        fail('missing value for --feature');
      }
      flags.feature = value;
      i += 1;
    } else if (arg.startsWith('--feature=')) {
      flags.feature = arg.slice('--feature='.length);
    } else {
      fail(`unknown option: ${arg}`);
    }
  }
  return flags;
}

function main() {
  const [type, rawName, ...rest] = process.argv.slice(2);

  if (type === undefined || HELP_FLAGS.has(type) || rest.includes('--help')) {
    console.log(USAGE);
    process.exit(0);
  }

  if (rawName === undefined) {
    console.error(`error: missing name for "npm run generate ${type}"`);
    console.error(USAGE);
    process.exit(1);
  }

  const flags = parseFlags(rest);
  if (flags.feature !== undefined && !FEATURE_RE.test(flags.feature)) {
    fail(`invalid feature name "${flags.feature}" for --feature — use lowercase kebab-case`);
  }

  switch (type) {
    case 'feature':
      if (flags.feature !== undefined) {
        fail('the "feature" command does not accept --feature');
      }
      generateFeature(rawName);
      break;
    case 'component':
      if (flags.feature !== undefined) {
        generateFeatureComponent(rawName, flags.feature);
      } else {
        generateComponent(rawName);
      }
      break;
    case 'hook':
      generateHook(rawName, flags.feature);
      break;
    case 'api':
      if (flags.feature !== undefined) {
        fail('the "api" command takes the feature name directly (no --feature)');
      }
      generateApi(rawName);
      break;
    default:
      fail(`unknown command "${type}"`);
  }

  console.log('\nDone.');
}

main();
