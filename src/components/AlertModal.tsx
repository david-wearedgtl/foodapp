import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  useColorScheme,
} from 'react-native';

interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  /** Primary action handler (e.g., 'Yes, Quit' or 'OK' for info alerts). */
  onConfirm: () => void;
  /** Secondary action handler (e.g., 'No, Continue'). If undefined, no cancel button is shown (one-button modal). */
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  /** Influences the title and confirm button color: 'warning' (Red), 'alert' (Orange), 'info' (Blue) */
  type: 'alert' | 'warning' | 'info';
}

const AlertModal: React.FC<CustomAlertModalProps> = ({
                                                       isVisible,
                                                       title,
                                                       message,
                                                       onConfirm,
                                                       onCancel,
                                                       confirmText = 'Confirm',
                                                       cancelText = 'Cancel',
                                                       type = 'info',
                                                     }) => {
  const isDarkMode = useColorScheme() === 'dark';

  // Theme-aware colors
  const dialogBg = isDarkMode ? '#333333' : '#ffffff';
  const dialogText = isDarkMode ? '#eeeeee' : '#333333';
  const overlayBg = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)';

  let titleColor = dialogText;
  let confirmButtonColor = '#3498db'; // Default info blue

  if (type === 'warning') {
    titleColor = '#c0392b'; // Warning red
    confirmButtonColor = '#c0392b';
  } else if (type === 'alert') {
    titleColor = '#f39c12'; // Alert orange
    confirmButtonColor = '#f39c12';
  }

  const styles = getStyles(dialogBg, dialogText, titleColor, confirmButtonColor, overlayBg);

  // Determine if this is a one-button alert
  const isOneButtonAlert = !onCancel;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      // Close action defaults to confirm if no cancel handler is provided
      onRequestClose={onCancel || onConfirm}
    >
      {/* Use the overlay to close the modal when tapping outside if there is a cancel action */}
      <Pressable style={styles.centeredView} onPress={onCancel || onConfirm}>
        <Pressable style={styles.modalView} onPress={() => { /* Prevent closing when tapping inside */ }}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          <View style={styles.buttonContainer}>
            {/* Render cancel button only if onCancel handler is provided */}
            {!isOneButtonAlert && (
              <Pressable
                style={[styles.button, styles.cancelButton, {borderColor: dialogText}]}
                onPress={onCancel}
              >
                <Text style={[styles.buttonText, { color: dialogText }]}>{cancelText}</Text>
              </Pressable>
            )}
            {/* Main action button. It takes full width if no cancel button is present */}
            <Pressable
              style={[styles.button, {
                backgroundColor: confirmButtonColor,
                width: isOneButtonAlert ? '100%' : '48%', // Full width for one-button alerts
              }]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, styles.confirmButtonText]}>{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Function to generate dynamic styles
const getStyles = (dialogBg: string, dialogText: string, titleColor: string, confirmButtonColor: string, overlayBg: string) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: overlayBg, // Dimmed background
  },
  modalView: {
    margin: 20,
    backgroundColor: dialogBg,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    maxWidth: 350,
    width: '90%',
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: titleColor,
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: dialogText,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 12,
    width: '48%', // Default width for two-button layout
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
  }
});

export default AlertModal;
