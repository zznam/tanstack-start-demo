import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AdvancedLesson } from '../components/AdvancedLesson'
import { CodeBlock } from '../components/CodeBlock'
import { ScenarioRunner } from '../components/ScenarioRunner'
import type { OutboxInput } from '../utils/outboxModels'
import { runOrderDelivery } from '../utils/outboxServerFns'

export const Route = createFileRoute('/features/outbox')({
  head: () => ({
    meta: [
      {
        title: 'Transactional Outbox & Event Delivery | TanStack Learning Lab',
      },
    ],
  }),
  component: OutboxPage,
})

function OutboxPage() {
  const [settings, setSettings] = useState<OutboxInput>({
    strategy: 'outbox',
    fault: 'after-commit',
    deduplicate: true,
  })
  return (
    <AdvancedLesson
      id="outbox"
      title="Transactional outbox & event delivery"
      intro="An online store saves an order, then billing must create its invoice. Explore what happens when the producer stops between those operations, a delivery acknowledgement disappears, or an event keeps failing."
      challenge="Compare direct publishing with an outbox when the producer stops after commit. Then lose the billing acknowledgement and turn consumer deduplication off. Can an outbox alone prevent duplicate invoices?"
      solution="The outbox preserves the delivery intent in the same transaction as the order. A relay can resume pending events, but a lost acknowledgement may cause redelivery. Billing must atomically record the event ID with the invoice to suppress duplicates. Marking an event processed before committing the invoice would instead risk losing the business effect."
      docs={[
        {
          label: 'Transactional outbox pattern',
          href: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html',
        },
        {
          label: 'PostgreSQL transactions',
          href: 'https://www.postgresql.org/docs/current/tutorial-transactions.html',
        },
        {
          label: 'Unique keys and ON CONFLICT',
          href: 'https://www.postgresql.org/docs/current/sql-insert.html',
        },
      ]}
    >
      <ScenarioRunner
        title="Real-world example: order confirmation to billing"
        run={() => runOrderDelivery({ data: settings })}
      >
        <label className="text-sm font-semibold">
          Publishing strategy
          <select
            className="demo-select mt-2"
            value={settings.strategy}
            onChange={(e) =>
              setSettings({
                ...settings,
                strategy: e.target.value as OutboxInput['strategy'],
              })
            }
          >
            <option value="outbox">Order + outbox in one transaction</option>
            <option value="direct">Save order, then publish directly</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Failure point
          <select
            className="demo-select mt-2"
            value={settings.fault}
            onChange={(e) =>
              setSettings({
                ...settings,
                fault: e.target.value as OutboxInput['fault'],
              })
            }
          >
            <option value="none">Healthy delivery</option>
            <option value="before-commit">
              Producer rolls back before commit
            </option>
            <option value="after-commit">Producer stops after commit</option>
            <option value="ack-lost">Billing acknowledgement is lost</option>
            <option value="consumer-crash">
              Consumer rolls back before commit
            </option>
            <option value="poison">Consumer rejects every attempt</option>
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold py-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={settings.deduplicate}
            onChange={(e) =>
              setSettings({ ...settings, deduplicate: e.target.checked })
            }
          />
          Deduplicate billing events
        </label>
      </ScenarioRunner>
      <section className="demo-panel space-y-4">
        <h2 className="text-lg font-bold">Follow the business effect</h2>
        <ol className="lesson-steps">
          <li>
            <strong>Producer transaction:</strong> commit the $49 order and its
            delivery intent together. A rollback leaves both absent.
          </li>
          <li>
            <strong>Relay:</strong> send pending events and mark them sent after
            acknowledgement. A stopped producer does not erase the pending row.
          </li>
          <li>
            <strong>Consumer transaction:</strong> use a unique (consumer, event
            ID) key and commit that marker with the invoice. Repeated delivery
            can then return success without another invoice.
          </li>
          <li>
            <strong>Exhausted retries:</strong> this model retains a rejected
            event after three attempts. Investigate the cause before replaying
            it; a dead-letter entry is not successful billing.
          </li>
        </ol>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <CodeBlock
          title="Producer · illustrative SQL transaction"
          code={`BEGIN;
INSERT INTO orders (id, amount_cents)
VALUES ('order-1001', 4900);

-- The same database transaction, not an HTTP call.
INSERT INTO outbox (event_id, order_id, status)
VALUES ('order-1001:placed', 'order-1001', 'pending');
COMMIT;

-- A separate worker publishes pending rows.
-- Acknowledgement happens before marking sent.
-- Workers need claims/leases and crash recovery.`}
        />
        <CodeBlock
          title="Consumer · illustrative transaction pseudocode"
          code={`await db.transaction(async tx => {
  const inserted = await tx.query(
    'INSERT INTO processed_events (consumer, event_id) '
    + 'VALUES ($1, $2) ON CONFLICT DO NOTHING '
    + 'RETURNING event_id',
    ['billing', event.id],
  )
  if (inserted.rowCount === 0) return // already done
  await tx.insertInvoice(event.orderId, event.amount)
})
// UNIQUE (consumer, event_id) is required.
// Acknowledge only after this transaction commits.
// Database rollback removes both writes.`}
        />
      </section>
      <section className="demo-panel space-y-3">
        <h2 className="text-lg font-bold">
          What a deployed version still needs
        </h2>
        <p className="demo-muted leading-relaxed">
          The model uses atomic in-memory snapshots within one invocation, not a
          database or a real queue. Its simulated restart discards the
          producer's local event while retaining the model store. A new run
          starts empty; no real order, invoice, payment, or message is created.
        </p>
        <p className="demo-muted leading-relaxed">
          A production implementation needs durable storage, unique constraints,
          worker leases, bounded backoff, event versions, and backlog alerts.
          Ordering is a separate requirement: parallel workers can deliver later
          events first. External effects such as charging a card need the
          provider's own idempotency mechanism; a local transaction cannot make
          an external API atomic.
        </p>
      </section>
    </AdvancedLesson>
  )
}
