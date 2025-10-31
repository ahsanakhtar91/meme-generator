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
          title: 'Meme Generator',
          headerTitleStyle: { color: ColorPalette.primary },
        }}
      />
    </Drawer>
  );
}
