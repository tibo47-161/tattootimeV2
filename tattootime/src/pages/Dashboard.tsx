import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Grid, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminAppointments from '../components/Admin/AdminAppointments';

const Dashboard: React.FC = () => {
  const { currentUser, logout, loading } = useAuth();
  const navigate = useNavigate();

  console.log('Dashboard component rendering');
  console.log('currentUser:', currentUser);
  console.log('loading:', loading);

  useEffect(() => {
    if (!loading && !currentUser) {
      // If not loading and no current user, redirect to login
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Fehler beim Abmelden:", error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h5">Dashboard wird geladen...</Typography>
      </Container>
    );
  }

  // Check if currentUser exists before accessing its properties
  if (currentUser?.role === 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                Willkommen im Dashboard, {currentUser.name || currentUser.email}!
              </Typography>
              <Button variant="contained" color="primary" onClick={handleLogout}>
                Abmelden
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Admin-Bereich: Terminverwaltung
              </Typography>
              <AdminAppointments currentUserId={currentUser.id} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  } else {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                Willkommen im Dashboard, {currentUser?.name || currentUser?.email}!
              </Typography>
              <Button variant="contained" color="primary" onClick={handleLogout}>
                Abmelden
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Ihr Dashboard
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography>Hier kommt der normale Benutzer-Dashboard-Inhalt hin.</Typography>
                {/* Beispiel für Benutzer-spezifische Termine oder Informationen */}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }
};

export default Dashboard; 