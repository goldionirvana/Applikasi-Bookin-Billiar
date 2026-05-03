import React from 'react';
import { Transaction, PricingSettings } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ReceiptProps {
  transaction: Transaction;
  settings: PricingSettings;
}

const Receipt: React.FC<ReceiptProps> = ({ transaction }) => {
  return (
    <div className="bg-white text-black p-8 max-w-xs mx-auto font-mono text-sm border border-gray-200" id="receipt-print">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold uppercase">CueMaster</h2>
        <p>Billiard Hall & Lounge</p>
        <p className="text-xs">Jl. Billiard No. 8, Jakarta</p>
      </div>

      <div className="border-t border-b border-black py-2 my-2 border-dashed">
        <div className="flex justify-between">
          <span>TGL:</span>
          <span>{format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        <div className="flex justify-between">
          <span>TABLE:</span>
          <span>{transaction.tableName}</span>
        </div>
        <div className="flex justify-between">
          <span>PELANGGAN:</span>
          <span>{transaction.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span>STATUS:</span>
          <span>{transaction.isMember ? 'MEMBER' : 'REGULER'}</span>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Mulai:</span>
          <span>{format(new Date(transaction.startTime), 'HH:mm')}</span>
        </div>
        <div className="flex justify-between">
          <span>Selesai:</span>
          <span>{format(new Date(transaction.endTime), 'HH:mm')}</span>
        </div>
        <div className="flex justify-between">
          <span>Durasi:</span>
          <span>{transaction.durationMinutes} menit</span>
        </div>
        <div className="flex justify-between font-bold border-b border-black border-dotted pb-1 mb-1">
          <span>Meja:</span>
          <span>Rp {transaction.tablePrice.toLocaleString('id-ID')}</span>
        </div>
        
        {transaction.orders && transaction.orders.length > 0 && (
          <div className="pt-1">
            <p className="font-bold underline mb-1">PESANAN F&B:</p>
            {transaction.orders.map((item, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{item.quantity}x {item.name} {item.variant ? `(${item.variant})` : ''}</span>
                <span>{(item.price * item.quantity).toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold mt-1 pt-1 border-t border-black border-dotted">
              <span>Total F&B:</span>
              <span>Rp {transaction.ordersPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-black pt-2 flex justify-between font-bold text-lg">
        <span>TOTAL AKHIR:</span>
        <span>Rp {transaction.totalPrice.toLocaleString('id-ID')}</span>
      </div>

      <div className="text-center mt-8 text-xs italic">
        <p>Terima Kasih Atas Kunjungan Anda!</p>
        <p>Selamat Bermain Kembali</p>
      </div>
    </div>
  );
};

export default Receipt;
