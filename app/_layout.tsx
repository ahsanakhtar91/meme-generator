import { Drawer } from 'expo-router/drawer';
import ColorPalette from '../colors';
import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { GeneratingContext } from '../context';

interface CustomDrawerProps extends DrawerContentComponentProps {
  isGenerating: boolean;
}

function CustomDrawerContent(props: CustomDrawerProps) {
  const { isGenerating, ...otherProps } = props;
  return (
    <DrawerContentScrollView {...otherProps}>
      {!isGenerating ? (
        <DrawerItemList {...otherProps} />
      ) : (
        <View style={styles.centerContent}>
          <Text style={styles.mainText}>Model is generating...</Text>
          <Text style={styles.subText}>Interrupt before switching model</Text>
        </View>
      )}
    </DrawerContentScrollView>
  );
}

export default function _layout() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  return (
    <GeneratingContext
      value={{
        setGlobalGenerating: (newState: boolean) => {
          setIsGenerating(newState);
          if (!newState) {
            // Reset progress when generation stops
            setCurrentStep(0);
            setTotalSteps(0);
          }
        },
        setGenerationProgress: (current: number, total: number) => {
          setCurrentStep(current);
          setTotalSteps(total);
        },
      }}
    >
      <Drawer
        drawerContent={(props) => (
          <CustomDrawerContent {...props} isGenerating={isGenerating} />
        )}
        screenOptions={{
          drawerActiveTintColor: ColorPalette.primary,
          drawerInactiveTintColor: '#888',
          headerTintColor: ColorPalette.primary,
          headerTitleStyle: { color: ColorPalette.primary },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Meme Generator',
            title: isGenerating && totalSteps > 0 
              ? `Generating image... ${currentStep}/${totalSteps}`
              : 'Meme Generator',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
      </Drawer>
    </GeneratingContext>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: ColorPalette.primary,
  },
  subText: {
    fontSize: 14,
    color: ColorPalette.strongPrimary,
  },
});
