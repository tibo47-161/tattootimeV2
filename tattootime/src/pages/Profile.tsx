import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, Snackbar, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/customerService';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { userId } = useParams();
  const isOwnProfile = !userId || userId === currentUser?.id;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (!userId || userId === currentUser?.id) {
          setName(currentUser?.name || '');
          setEmail(currentUser?.email || '');
          setPhone(currentUser?.phone || '');
          setStreet(currentUser?.address?.street || '');
          setCity(currentUser?.address?.city || '');
          setZipCode(currentUser?.address?.zipCode || '');
          setCountry(currentUser?.address?.country || '');
        } else {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setName(data.name || '');
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setStreet(data.address?.street || '');
            setCity(data.address?.city || '');
            setZipCode(data.address?.zipCode || '');
            setCountry(data.address?.country || '');
          } else {
            setError('Profil nicht gefunden');
          }
        }
      } catch (e) {
        setError('Fehler beim Laden des Profils');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [userId, currentUser]);

  const handleSave = async () => {
    setError(null);
    try {
      if (!currentUser?.id) throw new Error('Kein Nutzer angemeldet');
      await updateUserProfile(currentUser.id, {
        name,
        phone,
        address: { street, city, zipCode, country },
      });
      setSuccess(true);
    } catch (e) {
      setError('Fehler beim Speichern des Profils');
    }
  };

  if (loading) return <Typography>Lade Profil...</Typography>;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', my: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Mein Profil</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Name" fullWidth value={name} onChange={e => setName(e.target.value)} InputProps={{ readOnly: !isOwnProfile }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="E-Mail" fullWidth value={email} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Telefon" fullWidth value={phone} onChange={e => setPhone(e.target.value)} InputProps={{ readOnly: !isOwnProfile }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Straße" fullWidth value={street} onChange={e => setStreet(e.target.value)} InputProps={{ readOnly: !isOwnProfile }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Stadt" fullWidth value={city} onChange={e => setCity(e.target.value)} InputProps={{ readOnly: !isOwnProfile }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="PLZ" fullWidth value={zipCode} onChange={e => setZipCode(e.target.value)} InputProps={{ readOnly: !isOwnProfile }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Land" fullWidth value={country} onChange={e => setCountry(e.target.value)} InputProps={{ readOnly: !isOwnProfile }} />
          </Grid>
        </Grid>
        {isOwnProfile && (
          <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleSave}>
            Speichern
          </Button>
        )}
      </Paper>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Profil erfolgreich gespeichert!
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile; 