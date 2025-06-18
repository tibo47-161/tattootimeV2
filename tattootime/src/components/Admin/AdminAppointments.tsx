import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Appointment } from '../../types';

interface AdminAppointmentsProps {
  currentUserId: string;
  isAdmin: boolean;
}

const colorMap: Record<string, string> = {
  Tattoo: '#EF5350', // Red
  Jugendhilfe: '#42A5F5', // Blue
  Arzt: '#66BB6A', // Green
  Privat: '#FFEE58', // Yellow
  Blocked: '#9E9E9E', // Grey
};

const AdminAppointments: React.FC<AdminAppointmentsProps> = ({ currentUserId, isAdmin }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [open, setOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Omit<Appointment, 'id' | 'userId' | 'createdAt'>>({
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
    if (!isAdmin) return; // Only fetch if isAdmin is true
    const data = await getDocs(appointmentsCollectionRef);
    setAppointments(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Appointment[]);
  }, [appointmentsCollectionRef, isAdmin]);

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
    try {
      if (currentAppointment) {
        // Update appointment
        if (!currentAppointment.id) {
          throw new Error('Appointment ID is required for update');
        }
        const appointmentDoc = doc(db, 'appointments', currentAppointment.id);
        await updateDoc(appointmentDoc, dataToSave);

        // Send email to client on update
        if (formData.clientEmail) {
          await addDoc(collection(db, 'mail'), {
            to: formData.clientEmail,
            message: {
              subject: `Ihr Termin wurde aktualisiert - TattooTime App`,
              html: `
                <p>Hallo ${formData.clientName},</p>
                <p>Ihr Termin für <strong>${formData.service}</strong> am <strong>${formData.date}</strong> um <strong>${formData.time}</strong> wurde aktualisiert.</p>
                <p>Bitte überprüfen Sie die Details in der App.</p>
                <p>Mit freundlichen Grüßen,</p>
                <p>Ihr TattooTime Team</p>
              `,
            },
          });
        }

        // Send email to admin on update
        await addDoc(collection(db, 'mail'), {
          to: 'tobi196183@gmail.com', // Admin email
          message: {
            subject: 'Termin aktualisiert bei TattooTime',
            html: `
              <p>Hallo Admin,</p>
              <p>Ein Termin wurde aktualisiert:</p>
              <ul>
                <li><strong>Kunde:</strong> ${formData.clientName}</li>
                <li><strong>E-Mail:</strong> ${formData.clientEmail}</li>
                <li><strong>Dienstleistung:</strong> ${formData.serviceType || formData.service}</li>
                <li><strong>Datum:</strong> ${formData.date}</li>
                <li><strong>Uhrzeit:</strong> ${formData.time}</li>
              </ul>
            `,
          },
        });

      } else {
        // Add new appointment
        await addDoc(appointmentsCollectionRef, { ...dataToSave, createdAt: Timestamp.now() });

        // Send email to client on new appointment
        if (formData.clientEmail) {
          await addDoc(collection(db, 'mail'), {
            to: formData.clientEmail,
            message: {
              subject: `Ihre Terminbestätigung - TattooTime App`,
              html: `
                <p>Hallo ${formData.clientName},</p>
                <p>Vielen Dank für Ihre Buchung bei TattooTime!</p>
                <p>Ihr Termin für <strong>${formData.service}</strong> ist am <strong>${formData.date}</strong> um <strong>${formData.time}</strong>.</p>
                <p>Wir freuen uns auf Sie!</p>
                <p>Mit freundlichen Grüßen,</p>
                <p>Ihr TattooTime Team</p>
              `,
            },
          });
        }

        // Send email to admin on new appointment
        await addDoc(collection(db, 'mail'), {
          to: 'tobi196183@gmail.com', // Admin email
          message: {
            subject: 'Neuer Termin gebucht bei TattooTime',
            html: `
              <p>Hallo Admin,</p>
              <p>Es wurde ein neuer Termin gebucht:</p>
              <ul>
                <li><strong>Kunde:</strong> ${formData.clientName}</li>
                <li><strong>E-Mail:</strong> ${formData.clientEmail}</li>
                <li><strong>Dienstleistung:</strong> ${formData.serviceType || formData.service}</li>
                <li><strong>Datum:</strong> ${formData.date}</li>
                <li><strong>Uhrzeit:</strong> ${formData.time}</li>
              </ul>
            `,
          },
        });
      }
      getAppointments();
      handleClose();
    } catch (error) {
      console.error('Error adding/updating appointment and sending email:', error);
      // TODO: Show user feedback for error
    }
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
              <IconButton edge="end" aria-label="delete" onClick={() => {
                if (appointment.id) {
                  deleteAppointment(appointment.id);
                }
              }}>
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
            </>
          )}

          {formData.serviceType !== 'Blocked' && (
            <TextField
              margin="dense"
              name="clientEmail"
              label="Kunden E-Mail"
              type="email"
              fullWidth
              variant="outlined"
              value={formData.clientEmail}
              onChange={handleChange}
              sx={{ mt: 2 }}
            />
          )}

          <TextField
            margin="dense"
            name="notes"
            label="Notizen"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.notes}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />

          {formData.serviceType && (
            <TextField
              margin="dense"
              name="colorCode"
              label="Farbe"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.colorCode || colorMap[formData.serviceType] || ''}
              onChange={handleChange}
              sx={{ mt: 2 }}
              disabled // This field is now auto-filled based on serviceType
            />
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentAppointment ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAppointments; 