import axios from 'axios';
import { Routes, Route, Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import { HomePage } from './pages/home/HomePage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { LoginPage } from './pages/login/LoginPage';
import { RegisterPage } from './pages/register/RegisterPage';
import './App.css';

// Axios Interceptor for Authorization
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Protected Route Component
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [cart, setCart] = useState([]);

  const loadCart = async () => {
    try {
      const response = await axios.get('/api/cart-items?expand=product');
      setCart(response.data);
    } catch(err) {
      console.error('Failed to load cart', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadCart();
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage cart={cart} loadCart={loadCart} /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage cart={cart} loadCart={loadCart} /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage cart={cart} /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
