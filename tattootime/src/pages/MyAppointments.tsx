import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MyAppointmentsList from '../components/Customer/MyAppointmentsList';

const MyAppointments: React.FC = () => (
  <Box sx={{ maxWidth: 600, mx: 'auto', my: 4 }}>
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Meine Termine</Typography>
      <MyAppointmentsList />
    </Paper>
  </Box>
);

export default MyAppointments; 