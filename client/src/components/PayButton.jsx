import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function PayButton({ task, onPaid }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Step 1: Create a Razorpay order on the backend
      const { data } = await api.post('/payments/create-order', { taskId: task._id });

      // Mock Payment Bypass
      if (data.key === 'skip') {
        toast.success('✅ [TEST MODE] Payment simulated. Funds held in escrow!');
        onPaid({ ...task, paymentStatus: 'held' });
        setLoading(false);
        return;
      }

      // Step 2: Open the Razorpay checkout modal
      const options = {
        key: data.key,
        amount: data.amount,       // in paise
        currency: data.currency,
        name: 'TaskMate',
        description: `Payment for: ${task.title}`,
        order_id: data.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#6C63FF' },

        handler: async (response) => {
          // Step 3: Verify the payment signature on the backend
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              taskId: task._id,
            });
            toast.success('✅ Payment successful! Funds are held in escrow.');
            onPaid({ ...task, paymentStatus: 'held' });
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },

        modal: {
          ondismiss: () =>
            toast('Payment cancelled.', {
              icon: 'ℹ️',
              style: { background: '#1a1a1a', color: '#ccc', border: '1px solid #333' },
            }),
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Opening payment...
        </>
      ) : (
        `💳 Pay ₹${task.finalAmount?.toLocaleString('en-IN')} into Escrow`
      )}
    </button>
  );
}
