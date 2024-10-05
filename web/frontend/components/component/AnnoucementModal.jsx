// AnnouncementModal.js
import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem } from "@mui/material";
import { CalendarCheckIcon, CircleAlertIcon, MegaphoneIcon } from "../../public/icons/icons"; // Assuming you have these in an Icons.js file

export default function AnnouncementModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

  const handleSubmit = () => {
    onSubmit({ title, description, icon });
    onClose();
    // Reset form fields
    setTitle("");
    setDescription("");
    setIcon("");
  };

  const iconOptions = [
    { value: "calendar", label: "Calendar", component: CalendarCheckIcon },
    { value: "alert", label: "Alert", component: CircleAlertIcon },
    { value: "megaphone", label: "Megaphone", component: MegaphoneIcon },
  ];

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Announcement</DialogTitle>
      <DialogContent>
        <TextField
          label="Title"
          fullWidth
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select
          label="Icon"
          fullWidth
          margin="normal"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) {
              return <em>Select an icon</em>;
            }
            const selectedIcon = iconOptions.find((option) => option.value === selected);
            return (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {selectedIcon.component({ style: { marginRight: 8 } })}
                {selectedIcon.label}
              </div>
            );
          }}
        >
          <MenuItem value="" disabled>
            <em>Select an icon</em>
          </MenuItem>
          {iconOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {option.component({ style: { marginRight: 8 } })}
                {option.label}
              </div>
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary" disabled={!title || !description || !icon}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}