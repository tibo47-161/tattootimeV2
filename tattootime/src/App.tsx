import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import { ThemeProvider, createTheme } from '@mui/material';
import { blue, grey } from '@mui/material/colors';
import './App.css';
import ReviewForm from './components/Review/ReviewForm';
import MaterialManagement from './components/Admin/MaterialManagement';
import PaymentForm from './components/Payment/PaymentForm';
import CustomerHistory from './components/Customer/CustomerHistory';
import { Appointment } from './types';

const theme = createTheme({
  palette: {
    primary: {
      main: blue[700],
    },
    secondary: {
      main: grey[900],
    },
    background: {
      default: grey[50],
      paper: grey[100],
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Laden...</div>;
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  console.log('App component loaded and rendering');
  console.log('Current URL:', window.location.pathname);
  
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route
              path="/review"
              element={
                <PrivateRoute>
                  <ReviewForm
                    open={true}
                    onClose={() => { /* Dummy */ }}
                    appointment={{
                      id: 'dummy',
                      date: '2025-06-18',
                      time: '17:00',
                      clientName: 'Max Mustermann',
                      service: 'Test-Tattoo',
                      userId: 'dummy-user',
                      serviceType: 'Tattoo',
                    }}
                    onReviewSuccess={() => { /* Dummy */ }}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/material-management"
              element={
                <PrivateRoute>
                  <MaterialManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/payment"
              element={
                <PrivateRoute>
                  <PaymentForm
                    open={true}
                    onClose={() => { /* Dummy */ }}
                    appointment={{
                      id: 'dummy',
                      date: '2025-06-18',
                      time: '17:00',
                      clientName: 'Max Mustermann',
                      service: 'Test-Tattoo',
                      userId: 'dummy-user',
                      serviceType: 'Tattoo',
                    }}
                    onPaymentSuccess={() => { /* Dummy */ }}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer-history"
              element={
                <PrivateRoute>
                  <CustomerHistory />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
