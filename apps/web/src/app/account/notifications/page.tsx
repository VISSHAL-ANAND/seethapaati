import Link from 'next/link';
import { fetchApi } from '../../../lib/api-client';

type Notification = {
  id: string;
  orderId: string | null;
  eventType: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  attemptCount: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
};

type Preferences = {
  orderUpdates: boolean;
  shipmentUpdates: boolean;
  returnUpdates: boolean;
  refundUpdates: boolean;
};

const labels: Record<string,string> = {
  NOTIFY_ORDER_STATUS: 'Order update',
  NOTIFY_SHIPMENT_STATUS: 'Shipment update',
  NOTIFY_RETURN_STATUS: 'Return update',
  NOTIFY_REFUND_STATUS: 'Refund update',
};

export default async function NotificationsPage() {
  const [notifications, preferences] = await Promise.all([
    fetchApi<Notification[]>('/users/me/notifications'),
    fetchApi<Preferences>('/users/me/notifications/preferences'),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="grid gap-16 lg:grid-cols-[1fr_320px]">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-black/50">Account / Notifications</p>
          <h1 className="mt-4 font-serif text-5xl tracking-tight">Your updates.</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-black/60">
            Transactional updates are recorded here as they move through the delivery system.
          </p>

          <div className="mt-12 divide-y divide-black/10 border-y border-black/10">
            {notifications.length === 0 ? (
              <div className="py-16 text-sm text-black/50">No notifications yet.</div>
            ) : notifications.map((item) => (
              <article key={item.id} className="grid gap-4 py-7 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45">{labels[item.eventType] ?? 'Account update'}</p>
                  <h2 className="mt-2 text-lg">{item.subject}</h2>
                  {item.orderId && <Link href={`/orders/${item.orderId}/confirmation`} className="mt-2 inline-block text-xs underline underline-offset-4">View order</Link>}
                  {item.lastError && item.status === 'FAILED' && <p className="mt-3 text-xs text-red-700">Delivery is being retried.</p>}
                </div>
                <div className="text-left text-xs text-black/45 sm:text-right">
                  <p>{item.status}</p>
                  <p className="mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="border-l border-black/10 pl-8">
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Delivery preferences</p>
          <div className="mt-6 space-y-4 text-sm">
            {Object.entries(preferences).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between gap-6 border-b border-black/10 pb-4">
                <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-xs uppercase tracking-widest">{enabled ? 'On' : 'Off'}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-black/45">
            Preferences affect future transactional emails. Order state, payment state, inventory, refunds and fulfillment remain server-authoritative.
          </p>
        </aside>
      </div>
    </main>
  );
}
