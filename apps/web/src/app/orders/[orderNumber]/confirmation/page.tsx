'use client';
import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {fetchApi} from '@/lib/api-client';
type Order={orderNumber:string;status:string;items:Array<{productName:string;quantity:number;unitPriceCents:number;lineTotalCents:number}>;pricing:{grandTotalCents:number;currency:string};shippingAddress:Record<string,unknown>};
export default function ConfirmationPage(){
 const p=useParams<{orderNumber:string}>(); const [order,setOrder]=useState<Order|null>(null);
 useEffect(()=>{if(p.orderNumber)fetchApi<Order>(`/orders/${p.orderNumber}`).then(setOrder).catch(()=>{})},[p.orderNumber]);
 return <main className="mx-auto max-w-4xl px-6 py-16">{!order?<p>Loading order…</p>:<><p className="text-xs uppercase tracking-[.2em]">Order confirmed</p><h1 className="mt-3 text-4xl">{order.orderNumber}</h1><p className="mt-2 opacity-60">{order.status}</p><div className="mt-10 divide-y border-y">{order.items.map((i,n)=><div key={n} className="flex justify-between py-5"><span>{i.productName} × {i.quantity}</span><span>₹{(i.lineTotalCents/100).toFixed(2)}</span></div>)}</div><p className="mt-8 text-right text-xl">₹{(order.pricing.grandTotalCents/100).toFixed(2)}</p></>}</main>
}