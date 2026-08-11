/**
 * axe-core integration for component-level accessibility tests.
 * Deliberately uses axe-core directly (no jest-axe dependency).
 *
 * IMPORTANT: automated checks cannot prove WCAG compliance — they catch
 * a subset of issues. Always pair with the manual checklist in
 * docs/ACCESSIBILITY.md.
 */

import { render } from '@testing-library/react';
import axe from 'axe-core';
import { createElement, type ReactElement } from 'react';

export interface AxeTestOptions {
  /** axe rules to exclude (with justification, e.g. color-contrast in tests). */
  disabledRules?: string[];
  /** axe rules to include (defaults to all enabled rules). */
  includedRules?: string[];
}

/**
 * Run axe against the current document. Throws with a readable summary of
 * all violations when any are found.
 */
export async function expectNoAxeViolations(options: AxeTestOptions = {}): Promise<void> {
  const results = await axe.run(document.body, {
    rules: {
      ...(options.disabledRules?.reduce((acc, rule) => ({ ...acc, [rule]: { enabled: false } }), {}) ?? {}),
      ...(options.includedRules?.reduce((acc, rule) => ({ ...acc, [rule]: { enabled: true } }), {}) ?? {}),
    },
  });

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (violation) =>
          `- ${violation.id} (${violation.impact}): ${violation.help}\n  ${violation.nodes
            .slice(0, 3)
            .map((node) => `  ${node.html}`)
            .join('\n')}`,
      )
      .join('\n');
    throw new Error(`Accessibility violations found:\n${summary}`);
  }
}

/** Render an element and run an axe scan against it in one call. */
export async function renderAndCheckA11y(ui: ReactElement, options: AxeTestOptions = {}): Promise<ReturnType<typeof render>> {
  // Render inside a <main> landmark so axe's `region` rule does not fire on
  // standalone component fixtures.
  const utils = render(createElement('main', null, ui));
  await expectNoAxeViolations(options);
  return utils;
}
