import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Slider
} from '@mui/material';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';
import { Slot } from '../../types';

interface ExtendedBookingFormProps {
  open: boolean;
  onClose: () => void;
  slot: Slot | null;
  onBookingSuccess: () => void;
}

interface TattooDetails {
  bodyPart: string;
  tattooStyle: string;
  size: { width: number; height: number };
  complexity: 'simple' | 'medium' | 'complex' | 'very_complex';
  estimatedDuration: number;
  colors: string[];
  notes: string;
}

const bodyParts = [
  { value: 'arm', label: 'Arm' },
  { value: 'leg', label: 'Bein' },
  { value: 'back', label: 'Rücken' },
  { value: 'chest', label: 'Brust' },
  { value: 'ribs', label: 'Rippen' },
  { value: 'neck', label: 'Nacken' },
  { value: 'face', label: 'Gesicht' },
  { value: 'hand', label: 'Hand' },
  { value: 'foot', label: 'Fuß' }
];

const tattooStyles = [
  { value: 'traditional', label: 'Traditional' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'tribal', label: 'Tribal' },
  { value: 'lettering', label: 'Lettering' }
];

const colorOptions = [
  'black', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'white'
];

const ExtendedBookingForm: React.FC<ExtendedBookingFormProps> = ({
  open,
  onClose,
  slot,
  onBookingSuccess
}) => {
  const { currentUser } = useAuth();
  const functions = getFunctions();
  const bookSlotCallable = httpsCallable(functions, 'bookSlot');

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Grunddaten', 'Tattoo-Details', 'Preis & Zahlung', 'Bestätigung'];

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [tattooDetails, setTattooDetails] = useState<TattooDetails>({
    bodyPart: '',
    tattooStyle: '',
    size: { width: 10, height: 10 },
    complexity: 'medium',
    estimatedDuration: 120,
    colors: [],
    notes: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setClientName('');
      setClientEmail(currentUser?.email || '');
      setTattooDetails({
        bodyPart: '',
        tattooStyle: '',
        size: { width: 10, height: 10 },
        complexity: 'medium',
        estimatedDuration: 120,
        colors: [],
        notes: ''
      });
      setPricing(null);
      setCalculatedPrice(null);
      setError(null);
    }
  }, [open, currentUser]);

  const calculatePrice = useCallback(async () => {
    try {
      // This would call a pricing service or function
      // For now, we'll use a simple calculation
      const basePrice = 120; // €/hour
      const hours = tattooDetails.estimatedDuration / 60;
      const area = tattooDetails.size.width * tattooDetails.size.height;
      
      // Simple multipliers (in real app, these would come from pricing rules)
      const bodyPartMultiplier = tattooDetails.bodyPart === 'face' ? 2.0 : 1.0;
      const sizeMultiplier = area <= 25 ? 0.8 : area <= 100 ? 1.0 : area <= 400 ? 1.3 : 1.6;
      const styleMultiplier = tattooDetails.tattooStyle === 'realistic' ? 1.4 : 1.0;
      const complexityMultiplier = {
        simple: 0.9,
        medium: 1.0,
        complex: 1.3,
        very_complex: 1.6
      }[tattooDetails.complexity];

      const totalPrice = basePrice * hours * bodyPartMultiplier * sizeMultiplier * styleMultiplier * complexityMultiplier;
      const depositAmount = totalPrice * 0.3; // 30% deposit

      setCalculatedPrice(totalPrice);
      setPricing({
        basePrice: basePrice * hours,
        bodyPartMultiplier,
        sizeMultiplier,
        styleMultiplier,
        complexityMultiplier,
        totalPrice,
        depositAmount
      });
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  }, [tattooDetails]);

  // Calculate price when tattoo details change
  useEffect(() => {
    if (tattooDetails.bodyPart && tattooDetails.tattooStyle && tattooDetails.complexity) {
      calculatePrice();
    }
  }, [calculatePrice]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleColorToggle = (color: string) => {
    setTattooDetails(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return clientName.trim() !== '' && clientEmail.includes('@');
      case 1:
        return tattooDetails.bodyPart !== '' && tattooDetails.tattooStyle !== '';
      case 2:
        return calculatedPrice !== null;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!slot || !currentUser) return;

    try {
      setLoading(true);
      setError(null);

      if (!slot.id) {
        throw new Error('Slot ID ist erforderlich für die Buchung');
      }

      const bookingData = {
        slotId: slot.id,
        serviceType: slot.serviceType,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        bodyPart: tattooDetails.bodyPart,
        tattooStyle: tattooDetails.tattooStyle,
        size: tattooDetails.size,
        complexity: tattooDetails.complexity,
        estimatedDuration: tattooDetails.estimatedDuration,
        colors: tattooDetails.colors,
        notes: tattooDetails.notes
      };

      const result = await bookSlotCallable(bookingData);
      console.log('Booking result:', result.data);
      
      onBookingSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Booking error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Buchen des Termins';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Grunddaten
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="E-Mail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tattoo-Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Körperstelle</InputLabel>
                  <Select
                    value={tattooDetails.bodyPart}
                    onChange={(e) => setTattooDetails(prev => ({ ...prev, bodyPart: e.target.value }))}
                  >
                    {bodyParts.map(part => (
                      <MenuItem key={part.value} value={part.value}>
                        {part.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tattoo-Stil</InputLabel>
                  <Select
                    value={tattooDetails.tattooStyle}
                    onChange={(e) => setTattooDetails(prev => ({ ...prev, tattooStyle: e.target.value }))}
                  >
                    {tattooStyles.map(style => (
                      <MenuItem key={style.value} value={style.value}>
                        {style.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Breite (cm)"
                  type="number"
                  value={tattooDetails.size.width}
                  onChange={(e) => setTattooDetails(prev => ({ 
                    ...prev, 
                    size: { ...prev.size, width: Number(e.target.value) }
                  }))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Höhe (cm)"
                  type="number"
                  value={tattooDetails.size.height}
                  onChange={(e) => setTattooDetails(prev => ({ 
                    ...prev, 
                    size: { ...prev.size, height: Number(e.target.value) }
                  }))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Geschätzte Dauer: {tattooDetails.estimatedDuration} Minuten</Typography>
                <Slider
                  value={tattooDetails.estimatedDuration}
                  onChange={(_, value) => setTattooDetails(prev => ({ ...prev, estimatedDuration: value as number }))}
                  min={30}
                  max={480}
                  step={30}
                  marks={[
                    { value: 30, label: '30min' },
                    { value: 120, label: '2h' },
                    { value: 240, label: '4h' },
                    { value: 480, label: '8h' }
                  ]}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Komplexität</InputLabel>
                  <Select
                    value={tattooDetails.complexity}
                    onChange={(e) => setTattooDetails(prev => ({ ...prev, complexity: e.target.value as any }))}
                  >
                    <MenuItem value="simple">Einfach</MenuItem>
                    <MenuItem value="medium">Mittel</MenuItem>
                    <MenuItem value="complex">Komplex</MenuItem>
                    <MenuItem value="very_complex">Sehr komplex</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Farben</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {colorOptions.map(color => (
                    <Chip
                      key={color}
                      label={color}
                      onClick={() => handleColorToggle(color)}
                      color={tattooDetails.colors.includes(color) ? 'primary' : 'default'}
                      variant={tattooDetails.colors.includes(color) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notizen"
                  multiline
                  rows={3}
                  value={tattooDetails.notes}
                  onChange={(e) => setTattooDetails(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Referenzbilder, spezielle Wünsche, etc."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preis & Zahlung
            </Typography>
            {calculatedPrice && pricing && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Preisübersicht
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography>Basispreis:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>{pricing.basePrice.toFixed(2)}€</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>Körperstelle ({tattooDetails.bodyPart}):</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>×{pricing.bodyPartMultiplier}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>Größe ({tattooDetails.size.width}×{tattooDetails.size.height}cm):</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>×{pricing.sizeMultiplier}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>Stil ({tattooDetails.tattooStyle}):</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>×{pricing.styleMultiplier}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>Komplexität ({tattooDetails.complexity}):</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>×{pricing.complexityMultiplier}</Typography>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Grid item xs={6}>
                      <Typography variant="h6">Gesamtpreis:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">{calculatedPrice.toFixed(2)}€</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>Anzahlung (30%):</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>{pricing.depositAmount.toFixed(2)}€</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Bestätigung
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Termin-Details
                </Typography>
                <Typography><strong>Datum:</strong> {slot?.date}</Typography>
                <Typography><strong>Uhrzeit:</strong> {slot?.startTime} - {slot?.endTime}</Typography>
                <Typography><strong>Kunde:</strong> {clientName}</Typography>
                <Typography><strong>E-Mail:</strong> {clientEmail}</Typography>
                <Typography><strong>Körperstelle:</strong> {tattooDetails.bodyPart}</Typography>
                <Typography><strong>Stil:</strong> {tattooDetails.tattooStyle}</Typography>
                <Typography><strong>Größe:</strong> {tattooDetails.size.width}×{tattooDetails.size.height}cm</Typography>
                <Typography><strong>Dauer:</strong> {tattooDetails.estimatedDuration} Minuten</Typography>
                <Typography><strong>Gesamtpreis:</strong> {calculatedPrice?.toFixed(2)}€</Typography>
                {tattooDetails.notes && (
                  <Typography><strong>Notizen:</strong> {tattooDetails.notes}</Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Termin buchen</Typography>
        {slot && (
          <Typography variant="body2" color="text.secondary">
            {slot.date} um {slot.startTime} - {slot.endTime}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Zurück
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!validateStep(activeStep) || loading}
            variant="contained"
          >
            Weiter
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            color="primary"
          >
            {loading ? <CircularProgress size={24} /> : 'Termin buchen'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExtendedBookingForm; 