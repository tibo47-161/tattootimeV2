import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Appointment } from '../../types';

interface AdminAppointmentsProps {
  currentUserId: string;
}

const colorMap: Record<string, string> = {
  Tattoo: '#EF5350', // Red
  Jugendhilfe: '#42A5F5', // Blue
  Arzt: '#66BB6A', // Green
  Privat: '#FFEE58', // Yellow
  Blocked: '#9E9E9E', // Grey
};

const AdminAppointments: React.FC<AdminAppointmentsProps> = ({ currentUserId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [open, setOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Omit<Appointment, 'id' | 'userId'>>({
    date: '',
    time: '',
    clientName: '',
    service: '',
    serviceType: undefined,
    tattooStyle: '',
    bodyPart: '',
    clientEmail: '',
    notes: '',
    colorCode: '',
  });

  const appointmentsCollectionRef = collection(db, 'appointments');

  const getAppointments = useCallback(async () => {
    const data = await getDocs(appointmentsCollectionRef);
    setAppointments(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Appointment[]);
  }, [appointmentsCollectionRef]);

  useEffect(() => {
    getAppointments();
  }, [getAppointments]);

  const handleOpen = (appointment?: Appointment) => {
    setOpen(true);
    if (appointment) {
      setCurrentAppointment(appointment);
      setFormData({
        date: appointment.date || '',
        time: appointment.time || '',
        clientName: appointment.clientName || '',
        service: appointment.service || '',
        serviceType: appointment.serviceType || undefined,
        tattooStyle: appointment.tattooStyle || '',
        bodyPart: appointment.bodyPart || '',
        clientEmail: appointment.clientEmail || '',
        notes: appointment.notes || '',
        colorCode: appointment.colorCode || '',
      });
    } else {
      setCurrentAppointment(null);
      setFormData({
        date: '',
        time: '',
        clientName: '',
        service: '',
        serviceType: undefined,
        tattooStyle: '',
        bodyPart: '',
        clientEmail: '',
        notes: '',
        colorCode: '',
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentAppointment(null);
    setFormData({
      date: '',
      time: '',
      clientName: '',
      service: '',
      serviceType: undefined,
      tattooStyle: '',
      bodyPart: '',
      clientEmail: '',
      notes: '',
      colorCode: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceTypeChange = (e: SelectChangeEvent<Appointment['serviceType']>) => {
    const selectedServiceType = e.target.value as Appointment['serviceType'];
    const newColorCode = selectedServiceType ? colorMap[selectedServiceType] : '';

    setFormData(prev => ({
      ...prev,
      serviceType: selectedServiceType,
      colorCode: newColorCode,
      // Clear tattoo-specific fields if not a Tattoo appointment
      ...(selectedServiceType !== 'Tattoo' && { tattooStyle: '', bodyPart: '', clientEmail: '' }),
    }));
  };

  const handleSubmit = async () => {
    const dataToSave = { ...formData, userId: currentUserId };
    if (currentAppointment) {
      // Update appointment
      const appointmentDoc = doc(db, 'appointments', currentAppointment.id!);
      await updateDoc(appointmentDoc, dataToSave);
    } else {
      // Add new appointment
      await addDoc(appointmentsCollectionRef, dataToSave);
    }
    getAppointments();
    handleClose();
  };

  const deleteAppointment = async (id: string) => {
    const appointmentDoc = doc(db, 'appointments', id);
    await deleteDoc(appointmentDoc);
    getAppointments();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Alle Termine</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        Neuen Termin hinzufügen
      </Button>

      <List>
        {appointments.map((appointment) => (
          <ListItem key={appointment.id} divider>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <Box sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: appointment.colorCode || 'transparent',
                    mr: 1,
                  }} />
                  {`Datum: ${appointment.date}, Uhrzeit: ${appointment.time}`}
                </Box>
              }
              secondary={`Kunde: ${appointment.clientName}, Service: ${appointment.service}${appointment.serviceType ? `, Typ: ${appointment.serviceType}` : ''}`}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(appointment)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => deleteAppointment(appointment.id!)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{currentAppointment ? 'Termin bearbeiten' : 'Neuen Termin hinzufügen'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="date"
            label="Datum"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.date}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="time"
            label="Uhrzeit"
            type="time"
            fullWidth
            variant="outlined"
            value={formData.time}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="clientName"
            label="Kundenname"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.clientName}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="service"
            label="Service"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.service}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <InputLabel id="service-type-label">Terminart</InputLabel>
            <Select
              labelId="service-type-label"
              id="serviceType"
              name="serviceType"
              value={formData.serviceType || ''}
              label="Terminart"
              onChange={handleServiceTypeChange}
            >
              <MenuItem value="Tattoo">🔴 Tattoo-Termin</MenuItem>
              <MenuItem value="Jugendhilfe">🔵 Jugendhilfe-Arbeit</MenuItem>
              <MenuItem value="Arzt">🟢 Arzt</MenuItem>
              <MenuItem value="Privat">🟡 Privat / Freizeit</MenuItem>
              <MenuItem value="Blocked">⚫ Blockiert / Urlaub</MenuItem>
            </Select>
          </FormControl>

          {formData.serviceType === 'Tattoo' && (
            <>
              <TextField
                margin="dense"
                name="tattooStyle"
                label="Tattoo-Stil"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.tattooStyle}
                onChange={handleChange}
                sx={{ mt: 2 }}
              />
              <TextField
                margin="dense"
                name="bodyPart"
                label="Körperstelle"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.bodyPart}
                onChange={handleChange}
                sx={{ mt: 2 }}
              />
              <TextField
                margin="dense"
                name="clientEmail"
                label="Kunden-E-Mail"
                type="email"
                fullWidth
                variant="outlined"
                value={formData.clientEmail}
                onChange={handleChange}
                sx={{ mt: 2 }}
              />
            </>
          )}
          <TextField
            margin="dense"
            name="notes"
            label="Private Notizen"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={formData.notes}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Abbrechen</Button>
          <Button onClick={handleSubmit}>{currentAppointment ? 'Speichern' : 'Hinzufügen'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAppointments; 