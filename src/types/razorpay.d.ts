type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
};

interface Window {
  Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
}
