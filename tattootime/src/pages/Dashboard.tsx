import React, { useEffect } from 'react';
import { Container, Typography, Box, Button, Grid, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminAppointments from '../components/Admin/AdminAppointments';
import { getFunctions, httpsCallable } from "firebase/functions";
import Calendar from '../components/Calendar/Calendar';

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
    } catch (error: unknown) {
      console.error("Fehler beim Abmelden:", error);
    }
  };

  // New function to call addAdminRole
  const handleSetAdminRole = async () => {
    if (!currentUser || !currentUser.email) {
      console.error("Cannot set admin role: user not logged in or email missing.");
      return;
    }
    try {
      const functions = getFunctions();
      const addAdminRoleCallable = httpsCallable(functions, 'addAdminRole');
      const result = await addAdminRoleCallable({ email: currentUser.email });
      console.log('Admin role set successfully:', result.data);
      alert(`Admin role set successfully for ${currentUser.email}. Please log out and log back in.`);
      // Force re-authentication to refresh claims
      await logout(); // Trigger logout to force re-authentication
    } catch (error: unknown) {
      console.error('Error setting admin role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to set admin role: ${errorMessage}`);
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

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Termin Kalender
              </Typography>
              <Calendar isAdmin={currentUser?.role === 'admin'} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Admin-Bereich: Terminverwaltung
              </Typography>
              <AdminAppointments currentUserId={currentUser.id} isAdmin={true} />
            </Paper>
          </Grid>

          {/* Erweiterte Features für Admins */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Erweiterte Features
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button component={Link} to="/material-management" variant="outlined">
                  Materialverwaltung
                </Button>
                <Button component={Link} to="/payment" variant="outlined">
                  Zahlung
                </Button>
                <Button component={Link} to="/review" variant="outlined">
                  Bewertungssystem
                </Button>
                <Button component={Link} to="/customer-history" variant="outlined">
                  Kundenhistorie (GDPR)
                </Button>
              </Box>
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
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Termin Kalender
              </Typography>
              <Calendar isAdmin={currentUser?.role === 'admin'} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Ihr Dashboard
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography>Hier kommt der normale Benutzer-Dashboard-Inhalt hin.</Typography>
                {/* Temporary button to set admin role */}
                {currentUser && currentUser.email === 'tobi196183@gmail.com' && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSetAdminRole}
                    sx={{ mt: 2 }}
                  >
                    Set Admin Role for myself
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }
};

export default Dashboard; 