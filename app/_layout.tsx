import { Drawer } from 'expo-router/drawer';
import ColorPalette from '../colors';
import React from 'react';

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function _layout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: ColorPalette.accent,
        drawerInactiveTintColor: ColorPalette.textMuted,
        drawerStyle: {
          backgroundColor: ColorPalette.backgroundLight,
        },
        headerTintColor: ColorPalette.textSecondary,
        headerStyle: {
          backgroundColor: ColorPalette.background,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0, 212, 255, 0.1)',
        },
        headerTitleStyle: { 
          color: ColorPalette.textSecondary,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Meme Generator',
          title: 'Meme Generator',
          headerTitleStyle: { 
            color: ColorPalette.textSecondary,
            fontWeight: '600',
          },
        }}
      />
    </Drawer>
  );
}
