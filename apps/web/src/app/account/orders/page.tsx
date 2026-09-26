'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {fetchApi} from '@/lib/api-client';

type Order={id:string;orderNumber:string;status:string;createdAt:string;pricing:{grandTotalCents:number;currency:string}};
export default function OrdersPage(){
 const [orders,setOrders]=useState<Order[]>([]); const [error,setError]=useState('');
 useEffect(()=>{fetchApi<{items:Order[]}>('/orders').then(x=>setOrders(x.items)).catch(e=>setError(e.message))},[]);
 return <main className="mx-auto max-w-5xl px-6 py-16"><p className="text-xs uppercase tracking-[.2em]">Account</p><h1 className="mt-3 text-4xl">Your orders</h1>{error&&<p className="mt-8 text-sm">{error}</p>}<div className="mt-10 divide-y border-y">{orders.map(o=><Link key={o.id} href={`/orders/${o.id}/confirmation`} className="flex items-center justify-between py-6"><div><p className="font-medium">{o.orderNumber}</p><p className="mt-1 text-sm opacity-60">{o.status} · {new Date(o.createdAt).toLocaleDateString()}</p></div><p>₹{(o.pricing.grandTotalCents/100).toFixed(2)}</p></Link>)}</div></main>
}