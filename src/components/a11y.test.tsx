import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { MainNav } from '@/components/navigation/MainNav';
import { AccordionItem } from '@/components/ui/Accordion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { FormField } from '@/components/ui/FormField';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { expectNoAxeViolations, renderAndCheckA11y } from '@/tests/a11y';
import { renderWithProviders } from '@/tests/render';

// jsdom cannot compute colors, so contrast rules are disabled here;
// color-contrast is verified in the e2e @a11y scans against a real browser.
const axeOptions = { disabledRules: ['color-contrast'] };

describe('UI primitives axe scans', () => {
  it('Button is accessible', async () => {
    const { container } = await renderAndCheckA11y(<Button>Save</Button>, axeOptions);
    expect(container.querySelector('button')).not.toBeNull();
  });

  it('IconButton is accessible', async () => {
    await renderAndCheckA11y(<IconButton aria-label="Close">✕</IconButton>, axeOptions);
  });

  it('Badge is accessible', async () => {
    await renderAndCheckA11y(<Badge variant="success">Active</Badge>, axeOptions);
  });

  it('Input in a FormField has no violations', async () => {
    await renderAndCheckA11y(
      <FormField name="email" label="Email" error="Bad email">
        {(fieldId, describedById) => (
          <Input id={fieldId} aria-describedby={describedById} invalid />
        )}
      </FormField>,
      axeOptions,
    );
  });

  it('Textarea and Select are accessible', async () => {
    await renderAndCheckA11y(
      <>
        <label htmlFor="t">Notes</label>
        <Textarea id="t" />
        <label htmlFor="s">Role</label>
        <Select id="s" aria-label="Role">
          <option>Viewer</option>
        </Select>
      </>,
      axeOptions,
    );
  });

  it('Checkbox is accessible', async () => {
    await renderAndCheckA11y(
      <>
        <label htmlFor="accept-terms">Accept terms</label>
        <Checkbox id="accept-terms" />
      </>,
      axeOptions,
    );
  });

  it('RadioGroup is accessible', async () => {
    await renderAndCheckA11y(
      <RadioGroup legend="Billing">
        <Radio label="Monthly" />
        <Radio label="Annual" />
      </RadioGroup>,
      axeOptions,
    );
  });

  it('Switch is accessible', async () => {
    await renderAndCheckA11y(
      <Switch checked aria-label="Notifications" onCheckedChange={() => undefined} />,
      axeOptions,
    );
  });

  it('Dialog is accessible', async () => {
    await renderAndCheckA11y(
      <Dialog open onOpenChange={() => undefined} title="Confirm" description="Are you sure?">
        Body
      </Dialog>,
      axeOptions,
    );
  });

  it('DropdownMenu closed is accessible', async () => {
    await renderAndCheckA11y(
      <DropdownMenu
        triggerLabel="Actions"
        items={[{ label: 'Edit', onSelect: () => undefined }]}
      />,
      axeOptions,
    );
  });

  it('Tabs are accessible', async () => {
    await renderAndCheckA11y(
      <Tabs
        aria-label="Profile"
        items={[
          { id: 'a', label: 'Overview', content: <p>Overview</p> },
          { id: 'b', label: 'Settings', content: <p>Settings</p> },
        ]}
        activeTabId="a"
        onActiveTabChange={() => undefined}
      />,
      axeOptions,
    );
  });

  it('Accordion is accessible', async () => {
    await renderAndCheckA11y(<AccordionItem summary="Details">Content</AccordionItem>, axeOptions);
  });

  it('Pagination is accessible', async () => {
    await renderAndCheckA11y(
      <Pagination page={1} totalPages={5} onPageChange={() => undefined} />,
      axeOptions,
    );
  });

  it('Alert danger uses role=alert without violations', async () => {
    await renderAndCheckA11y(<Alert variant="danger">Failed</Alert>, axeOptions);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('EmptyState is accessible', async () => {
    await renderAndCheckA11y(
      <EmptyState title="Nothing here" description="Try again" />,
      axeOptions,
    );
  });

  it('ErrorState is accessible', async () => {
    await renderAndCheckA11y(<ErrorState title="Oops" description="Try again" />, axeOptions);
  });

  it('PageHeader is accessible', async () => {
    await renderAndCheckA11y(<PageHeader title="Users" description="Manage users" />, axeOptions);
  });

  it('Breadcrumbs and MainNav are accessible', async () => {
    const result = renderWithProviders(
      <>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Users' }]} />
        <MainNav items={[{ label: 'Home', to: '/' }]} />
      </>,
    );
    await expectNoAxeViolations(axeOptions);
    expect(result.container.querySelector('nav')).toBeInTheDocument();
  });

  it('Tooltip is accessible with aria-describedby wiring', async () => {
    const { container } = await renderAndCheckA11y(<TooltipHarness />, axeOptions);
    expect(container.querySelector('[aria-describedby]')).not.toBeNull();
  });
});

function TooltipHarness() {
  return (
    <span>
      <button type="button" aria-describedby="tooltip-hint">
        Info
      </button>
      <span id="tooltip-hint" role="tooltip">
        More info
      </span>
    </span>
  );
}
