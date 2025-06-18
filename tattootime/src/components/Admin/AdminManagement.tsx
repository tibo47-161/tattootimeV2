import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { AdminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import BackToDashboard from '../Navigation/BackToDashboard';

const AdminManagement: React.FC = () => {
  const { currentUser } = useAuth();
  // Debug-Ausgabe für Admin-Status und User
  // eslint-disable-next-line no-console
  console.log("[AdminManagement] currentUser:", currentUser);
  // eslint-disable-next-line no-console
  console.log("[AdminManagement] isAdmin:", AdminService.isAdmin(currentUser));
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    email: string;
  }>({
    open: false,
    email: '',
  });

  // Prüfen, ob der aktuelle Benutzer Admin-Rechte hat
  if (!AdminService.isAdmin(currentUser)) {
    return (
      <Box sx={{ p: 3 }}>
        <BackToDashboard />
        <Alert severity="error">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </Alert>
      </Box>
    );
  }

  const handleAddAdmin = async () => {
    if (!email.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie eine E-Mail-Adresse ein.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await AdminService.addAdminRole(email.trim());
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success',
      });
      setEmail('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Hinzufügen der Admin-Rolle';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    setLoading(true);
    try {
      const result = await AdminService.removeAdminRole(removeDialog.email);
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success',
      });
      setRemoveDialog({ open: false, email: '' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Entfernen der Admin-Rolle';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const openRemoveDialog = (email: string) => {
    setRemoveDialog({ open: true, email });
  };

  const closeRemoveDialog = () => {
    setRemoveDialog({ open: false, email: '' });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <BackToDashboard />
      
      <Typography variant="h4" gutterBottom>
        Admin-Verwaltung
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Hier können Sie anderen Benutzern Admin-Rechte gewähren oder entziehen.
      </Typography>

      {/* Admin hinzufügen */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Admin-Rolle hinzufügen
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              label="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="benutzer@example.com"
              fullWidth
              disabled={loading}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddAdmin}
              disabled={loading || !email.trim()}
            >
              Admin hinzufügen
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Admin entfernen */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Admin-Rolle entfernen
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Klicken Sie auf das Entfernen-Symbol neben der E-Mail-Adresse, um die Admin-Rolle zu entfernen.
          </Typography>
          
          {/* Beispiel-Liste (in einer echten Anwendung würden Sie hier die tatsächlichen Admins laden) */}
          <Paper variant="outlined">
            <List>
              <ListItem
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="Admin entfernen"
                    onClick={() => openRemoveDialog('admin@example.com')}
                    disabled={loading}
                  >
                    <RemoveIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary="admin@example.com"
                  secondary="Hauptadministrator"
                />
              </ListItem>
              <Divider />
              <ListItem
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="Admin entfernen"
                    onClick={() => openRemoveDialog('assistant@example.com')}
                    disabled={loading}
                  >
                    <RemoveIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary="assistant@example.com"
                  secondary="Assistent"
                />
              </ListItem>
            </List>
          </Paper>
        </CardContent>
      </Card>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog zum Bestätigen des Entfernens */}
      <Dialog open={removeDialog.open} onClose={closeRemoveDialog}>
        <DialogTitle>Admin-Rolle entfernen</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie die Admin-Rolle von{' '}
            <strong>{removeDialog.email}</strong> entfernen möchten?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRemoveDialog} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleRemoveAdmin}
            color="error"
            disabled={loading}
          >
            Entfernen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminManagement; 