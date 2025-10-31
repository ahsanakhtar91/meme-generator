import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import ColorPalette from '../colors';

interface SpinnerProps {
  visible: boolean;
  textContent?: string;
  imageProgress?: number;
  textProgress?: number;
}

const ProgressBar = ({ progress, label }: { progress: number; label: string }) => {
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
    </View>
  );
};

const Spinner = ({ visible, textContent, imageProgress = 0, textProgress = 0 }: SpinnerProps) => {
  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Loading Models</Text>
          <Text style={styles.subtitle}>Please wait while models are being loaded...</Text>
          
          <ProgressBar progress={imageProgress} label="Image Model" />
          <ProgressBar progress={textProgress} label="Text Model" />
          
          {textContent && <Text style={styles.text}>{textContent}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    backgroundColor: ColorPalette.backgroundCard,
    borderRadius: 16,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    shadowColor: ColorPalette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ColorPalette.accent,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: ColorPalette.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginVertical: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ColorPalette.textPrimary,
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ColorPalette.accent,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    color: ColorPalette.textSecondary,
    textAlign: 'right',
    fontWeight: '500',
  },
  text: {
    marginTop: 15,
    color: ColorPalette.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Spinner;
