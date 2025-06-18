import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';
import { Appointment } from '../../types';

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onPaymentSuccess: () => void;
}

const paymentMethods = [
  { value: 'stripe', label: 'Kreditkarte (Stripe)', icon: '💳' },
  { value: 'paypal', label: 'PayPal', icon: '🅿️' },
  { value: 'cash', label: 'Bar', icon: '💵' },
  { value: 'bank_transfer', label: 'Banküberweisung', icon: '🏦' }
];

const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  onClose,
  appointment,
  onPaymentSuccess
}) => {
  const { currentUser } = useAuth();
  const functions = getFunctions();
  const processPaymentCallable = httpsCallable(functions, 'processPayment');

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'deposit' | 'remaining' | 'full'>('deposit');
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate amounts
  const totalPrice = appointment?.pricing?.totalPrice || 0;
  const depositAmount = appointment?.pricing?.depositAmount || 0;
  const remainingAmount = totalPrice - depositAmount;
  const depositPaid = appointment?.pricing?.depositPaid || false;

  // Set default amount based on payment type
  React.useEffect(() => {
    if (appointment) {
      switch (paymentType) {
        case 'deposit':
          setAmount(depositAmount);
          break;
        case 'remaining':
          setAmount(remainingAmount);
          break;
        case 'full':
          setAmount(totalPrice);
          break;
      }
    }
  }, [paymentType, appointment, depositAmount, remainingAmount, totalPrice]);

  const handleSubmit = async () => {
    if (!appointment || !currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        appointmentId: appointment.id!,
        amount: amount,
        paymentMethod: paymentMethod as 'stripe' | 'paypal' | 'cash' | 'bank_transfer',
        paymentType: paymentType
      };

      const result = await processPaymentCallable(paymentData);
      console.log('Payment result:', result.data);
      
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Fehler bei der Zahlungsverarbeitung');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = () => {
    if (!appointment) return 'unknown';
    
    if (appointment.payment?.status === 'fully_paid') return 'paid';
    if (appointment.pricing?.depositPaid) return 'deposit_paid';
    return 'pending';
  };

  const renderPaymentOptions = () => {
    const status = getPaymentStatus();

    if (status === 'paid') {
      return (
        <Alert severity="success">
          Dieser Termin ist bereits vollständig bezahlt.
        </Alert>
      );
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Zahlungsart wählen
          </Typography>
        </Grid>
        {paymentMethods.map((method) => (
          <Grid item xs={12} sm={6} key={method.value}>
            <Card
              variant={paymentMethod === method.value ? 'elevation' : 'outlined'}
              sx={{
                cursor: 'pointer',
                border: paymentMethod === method.value ? 2 : 1,
                borderColor: paymentMethod === method.value ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                }
              }}
              onClick={() => setPaymentMethod(method.value)}
            >
              <CardContent>
                <Typography variant="h6">
                  {method.icon} {method.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Zahlungstyp
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            variant={paymentType === 'deposit' ? 'elevation' : 'outlined'}
            sx={{
              cursor: depositPaid ? 'not-allowed' : 'pointer',
              opacity: depositPaid ? 0.5 : 1,
              border: paymentType === 'deposit' ? 2 : 1,
              borderColor: paymentType === 'deposit' ? 'primary.main' : 'divider',
            }}
            onClick={() => !depositPaid && setPaymentType('deposit')}
          >
            <CardContent>
              <Typography variant="h6">Anzahlung</Typography>
              <Typography variant="body2">{depositAmount.toFixed(2)}€</Typography>
              {depositPaid && <Chip label="Bereits bezahlt" color="success" size="small" />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            variant={paymentType === 'remaining' ? 'elevation' : 'outlined'}
            sx={{
              cursor: !depositPaid ? 'not-allowed' : 'pointer',
              opacity: !depositPaid ? 0.5 : 1,
              border: paymentType === 'remaining' ? 2 : 1,
              borderColor: paymentType === 'remaining' ? 'primary.main' : 'divider',
            }}
            onClick={() => depositPaid && setPaymentType('remaining')}
          >
            <CardContent>
              <Typography variant="h6">Restzahlung</Typography>
              <Typography variant="body2">{remainingAmount.toFixed(2)}€</Typography>
              {!depositPaid && <Chip label="Anzahlung erforderlich" color="warning" size="small" />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            variant={paymentType === 'full' ? 'elevation' : 'outlined'}
            sx={{
              cursor: 'pointer',
              border: paymentType === 'full' ? 2 : 1,
              borderColor: paymentType === 'full' ? 'primary.main' : 'divider',
            }}
            onClick={() => setPaymentType('full')}
          >
            <CardContent>
              <Typography variant="h6">Vollzahlung</Typography>
              <Typography variant="body2">{totalPrice.toFixed(2)}€</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Betrag (€)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            InputProps={{
              startAdornment: <Typography>€</Typography>,
            }}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Zahlung verarbeiten</Typography>
        {appointment && (
          <Typography variant="body2" color="text.secondary">
            Termin: {appointment.date} um {appointment.time}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        {appointment && (
          <Box sx={{ mb: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Termin-Übersicht
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography><strong>Kunde:</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>{appointment.clientName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Gesamtpreis:</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>{totalPrice.toFixed(2)}€</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Anzahlung:</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {depositAmount.toFixed(2)}€
                      {depositPaid && <Chip label="Bezahlt" color="success" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Restbetrag:</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>{remainingAmount.toFixed(2)}€</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderPaymentOptions()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !paymentMethod || amount <= 0 || getPaymentStatus() === 'paid'}
          variant="contained"
          color="primary"
        >
          {loading ? <CircularProgress size={24} /> : 'Zahlung verarbeiten'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm; 