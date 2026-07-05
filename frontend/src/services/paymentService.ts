import API from './api';

export const depositFunds = async (amount: number) => {
  const response = await API.post('auth/payments/deposit/', { amount });
  return response.data;
};

export const withdrawFunds = async (amount: number) => {
  const response = await API.post('auth/payments/withdraw/', { amount });
  return response.data;
};

export const transferFunds = async (amount: number, receiverEmail: string) => {
  const response = await API.post('auth/payments/transfer/', {
    amount,
    receiver_email: receiverEmail,
  });
  return response.data;
};

export const fetchTransactions = async () => {
  const response = await API.get('auth/transactions/');
  // Backend uses pagination, so the real list is inside `results`
  return response.data.results ?? response.data;
};