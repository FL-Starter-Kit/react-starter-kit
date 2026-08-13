import { useState } from 'react';

import { useTheme } from '@/app/providers/themeContext';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useRouteBreadcrumbs } from '@/components/navigation/useRouteBreadcrumbs';
import { AccordionItem } from '@/components/ui/Accordion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { Drawer } from '@/components/ui/Drawer';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { FormField } from '@/components/ui/FormField';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Pagination } from '@/components/ui/Pagination';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { Tooltip } from '@/components/ui/Tooltip';

import styles from './ComponentsPage.module.css';

/**
 * Live documentation of the UI primitives. Doubles as a design-system
 * reference and a manual accessibility check page.
 */
export default function ComponentsPage() {
  const { mode, setMode } = useTheme();
  const breadcrumbs = useRouteBreadcrumbs();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);
  const [tabId, setTabId] = useState('t1');
  const [page, setPage] = useState(1);

  return (
    <Container>
      <PageHeader
        eyebrow="Design system"
        title="Components"
        description="The accessible UI primitives, rendered live. All components ship with keyboard support, ARIA wiring and tests."
      />
      <Breadcrumbs items={breadcrumbs} />

      <section aria-labelledby="theme-heading" className={styles.section}>
        <h2 id="theme-heading" className={styles.heading}>
          Theme
        </h2>
        <div className={styles.row}>
          <Select
            id="theme-select"
            aria-label="Theme"
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as typeof mode);
            }}
            className={styles.themeSelect}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </Select>
        </div>
      </section>

      <section aria-labelledby="buttons-heading" className={styles.section}>
        <h2 id="buttons-heading" className={styles.heading}>
          Buttons &amp; icon buttons
        </h2>
        <div className={styles.row}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className={styles.row}>
          <IconButton aria-label="Add item">
            <span aria-hidden="true">+</span>
          </IconButton>
          <IconButton aria-label="Save changes" variant="ghost">
            <span aria-hidden="true">💾</span>
          </IconButton>
          <IconButton aria-label="Delete item" variant="danger">
            <span aria-hidden="true">🗑</span>
          </IconButton>
        </div>
      </section>

      <section aria-labelledby="forms-heading" className={styles.section}>
        <h2 id="forms-heading" className={styles.heading}>
          Form controls
        </h2>
        <div className={styles.grid}>
          <FormField name="demo-name" label="Full name" hint="As shown on your profile." required>
            {(fieldId, describedById) => (
              <Input id={fieldId} placeholder="Ada Lovelace" aria-describedby={describedById} />
            )}
          </FormField>
          <FormField name="demo-email" label="Email" error="Enter a valid email address." required>
            {(fieldId, describedById) => (
              <Input
                id={fieldId}
                type="email"
                invalid
                aria-describedby={describedById}
                placeholder="ada@example.com"
              />
            )}
          </FormField>
          <FormField name="demo-role" label="Role" required>
            {(fieldId, describedById) => (
              <Select id={fieldId} aria-describedby={describedById}>
                <option>Viewer</option>
                <option>Editor</option>
                <option>Admin</option>
              </Select>
            )}
          </FormField>
          <FormField name="demo-bio" label="Bio">
            {(fieldId, describedById) => <Textarea id={fieldId} aria-describedby={describedById} />}
          </FormField>
          <Label>
            <Checkbox defaultChecked /> Subscribe to updates
          </Label>
          <RadioGroup legend="Notification frequency">
            <Radio name="demo-frequency" value="daily" label="Daily digest" />
            <Radio
              name="demo-frequency"
              value="weekly"
              label="Weekly digest"
              hint="Recommended"
              defaultChecked
            />
          </RadioGroup>
          <Label className={styles.switchRow}>
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
            <span>Two-factor authentication</span>
          </Label>
        </div>
      </section>

      <section aria-labelledby="overlays-heading" className={styles.section}>
        <h2 id="overlays-heading" className={styles.heading}>
          Overlays
        </h2>
        <div className={styles.row}>
          <Button
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            Open dialog
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDrawerOpen(true);
            }}
          >
            Open drawer
          </Button>
          <DropdownMenu
            triggerLabel="Menu"
            items={[
              { label: 'Edit', onSelect: () => undefined },
              { label: 'Duplicate', onSelect: () => undefined },
              { label: 'Delete', onSelect: () => undefined, destructive: true },
            ]}
          />
          <Tooltip label="Archives the current record.">
            <Button variant="secondary">Archive</Button>
          </Tooltip>
        </div>
      </section>

      <section aria-labelledby="feedback-heading" className={styles.section}>
        <h2 id="feedback-heading" className={styles.heading}>
          Feedback &amp; states
        </h2>
        <div className={styles.stack}>
          <Alert variant="info" title="Heads up">
            A new version of the design tokens shipped.
          </Alert>
          <Alert variant="success" title="Saved">
            Your changes were saved.
          </Alert>
          <Alert variant="warning" title="Review required">
            This record is pending review.
          </Alert>
          <Alert variant="danger" title="Error">
            The request could not be completed.
          </Alert>
          <div className={styles.row}>
            <Spinner />
            <Spinner size="lg" />
            <Badge>Neutral</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          <div className={styles.row}>
            <Skeleton width="12rem" />
            <Skeleton width="8rem" />
            <Skeleton width="16rem" />
          </div>
        </div>
      </section>

      <section aria-labelledby="structure-heading" className={styles.section}>
        <h2 id="structure-heading" className={styles.heading}>
          Structure &amp; empty/error states
        </h2>
        <Tabs
          activeTabId={tabId}
          onActiveTabChange={setTabId}
          aria-label="Structure examples"
          items={[
            {
              id: 't1',
              label: 'Accordion',
              content: (
                <div className={styles.stack}>
                  <AccordionItem summary="Why native elements?">
                    Native HTML elements ship accessibility behavior (keyboard, screen reader,
                    focus) for free. We prefer them over ARIA-invented patterns.
                  </AccordionItem>
                  <AccordionItem summary="What about focus management?">
                    The Dialog and Drawer use the native <code>&lt;dialog&gt;</code> element, which
                    traps focus and handles ESC automatically.
                  </AccordionItem>
                </div>
              ),
            },
            {
              id: 't2',
              label: 'Pagination',
              content: <Pagination page={page} totalPages={5} onPageChange={setPage} />,
            },
            {
              id: 't3',
              label: 'Empty & error states',
              content: (
                <div className={styles.stack}>
                  <EmptyState
                    title="No records yet"
                    description="Create your first record to get started."
                  />
                  <ErrorState onRetry={() => undefined} />
                </div>
              ),
            },
          ]}
        />
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Example dialog"
        description="A modal built on the native dialog element."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p>
          Focus is trapped inside this dialog. ESC and the close button both work. Focus returns to
          the trigger.
        </p>
      </Dialog>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Example drawer"
        description="A side panel with the same modal semantics."
      >
        <p>
          Drawers are for secondary content that supports the current page without navigating away.
        </p>
      </Drawer>
    </Container>
  );
}
