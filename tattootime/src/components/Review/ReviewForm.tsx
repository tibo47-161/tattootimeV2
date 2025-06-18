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
  Rating,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';
import { Appointment } from '../../types';

interface ReviewFormProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onReviewSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  open,
  onClose,
  appointment,
  onReviewSuccess
}) => {
  const { currentUser } = useAuth();
  const functions = getFunctions();
  const createReviewCallable = httpsCallable(functions, 'createReview');

  // Form state
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setRating(0);
      setComment('');
      setIsAnonymous(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!appointment || !currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const reviewData = {
        appointmentId: appointment.id!,
        rating: rating,
        comment: comment.trim() || undefined,
        isAnonymous: isAnonymous
      };

      const result = await createReviewCallable(reviewData);
      console.log('Review result:', result.data);
      
      onReviewSuccess();
      onClose();
    } catch (err: any) {
      console.error('Review error:', err);
      setError(err.message || 'Fehler beim Erstellen der Bewertung');
    } finally {
      setLoading(false);
    }
  };

  const canReview = () => {
    if (!appointment) return false;
    
    // Check if appointment is in the past (at least 24h ago)
    const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
    const now = new Date();
    const timeDiff = now.getTime() - appointmentDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  };

  const getReviewStatus = () => {
    if (!appointment) return 'unknown';
    
    if (appointment.aftercare?.rating) return 'already_reviewed';
    if (!canReview()) return 'too_early';
    return 'can_review';
  };

  const renderReviewStatus = () => {
    const status = getReviewStatus();

    switch (status) {
      case 'already_reviewed':
        return (
          <Alert severity="info">
            Sie haben bereits eine Bewertung für diesen Termin abgegeben.
          </Alert>
        );
      case 'too_early':
        return (
          <Alert severity="warning">
            Bewertungen können erst 24 Stunden nach dem Termin abgegeben werden.
          </Alert>
        );
      default:
        return null;
    }
  };

  const renderStars = () => {
    const labels: { [index: string]: string } = {
      1: 'Sehr schlecht',
      2: 'Schlecht',
      3: 'Okay',
      4: 'Gut',
      5: 'Sehr gut'
    };

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Rating
          name="rating"
          value={rating}
          onChange={(_, newValue) => setRating(newValue || 0)}
          size="large"
          icon={<StarIcon sx={{ fontSize: 40 }} />}
        />
        {rating > 0 && (
          <Typography variant="h6" color="primary">
            {labels[rating]}
          </Typography>
        )}
      </Box>
    );
  };

  if (!appointment) {
    return null;
  }

  const status = getReviewStatus();
  const canSubmit = status === 'can_review' && rating > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Bewertung abgeben</Typography>
        <Typography variant="body2" color="text.secondary">
          Termin: {appointment.date} um {appointment.time}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Termin-Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography><strong>Datum:</strong></Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>{appointment.date}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Uhrzeit:</strong></Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>{appointment.time}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Service:</strong></Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>{appointment.serviceType}</Typography>
                </Grid>
                {appointment.bodyPart && (
                  <>
                    <Grid item xs={6}>
                      <Typography><strong>Körperstelle:</strong></Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>{appointment.bodyPart}</Typography>
                    </Grid>
                  </>
                )}
                {appointment.tattooStyle && (
                  <>
                    <Grid item xs={6}>
                      <Typography><strong>Stil:</strong></Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>{appointment.tattooStyle}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {renderReviewStatus()}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {status === 'can_review' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Ihre Bewertung
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Wie bewerten Sie Ihren Termin?</Typography>
              {renderStars()}
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Kommentar (optional)"
                multiline
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Teilen Sie Ihre Erfahrungen mit uns..."
                helperText="Ihr Kommentar hilft anderen Kunden bei der Entscheidung."
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                }
                label="Anonyme Bewertung"
              />
              <Typography variant="body2" color="text.secondary">
                Bei einer anonymen Bewertung wird Ihr Name nicht angezeigt.
              </Typography>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Hinweis:</strong> Bewertungen können nur für echte Termine abgegeben werden 
                und sind nach dem Absenden nicht mehr änderbar.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          variant="contained"
          color="primary"
        >
          {loading ? <CircularProgress size={24} /> : 'Bewertung absenden'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewForm; 