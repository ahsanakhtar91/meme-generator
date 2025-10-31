import React, { memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import MarkdownComponent from './MarkdownComponent';
import LlamaIcon from '../assets/icons/llama_icon.svg';
import ColorPalette from '../colors';

export interface ImageMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Base64 image data
}

interface ImageMessageItemProps {
  message: ImageMessage;
  deleteMessage: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const ImageMessageItem = memo(({ message, deleteMessage }: ImageMessageItemProps) => {
  return (
    <View
      style={
        message.role === 'assistant' ? styles.aiMessage : styles.userMessage
      }
    >
      {message.role === 'assistant' && (
        <View style={styles.aiMessageIconContainer}>
          <LlamaIcon width={24} height={24} />
        </View>
      )}
      <View style={styles.messageContent}>
        {message.content && <MarkdownComponent text={message.content} />}
        {message.image && (
          <Image 
            source={{ uri: message.image }}
            style={styles.generatedImage}
            resizeMode="contain"
          />
        )}
      </View>
      <CloseButton deleteMessage={deleteMessage} role={message.role} />
    </View>
  );
});

const CloseButton = ({
  deleteMessage,
  role,
}: {
  deleteMessage: () => void;
  role: string;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.closeButton,
        role === 'assistant' ? styles.closeButtonRight : styles.closeButtonLeft,
      ]}
      onPress={deleteMessage}
    >
      <Text style={styles.buttonText}>✕</Text>
    </TouchableOpacity>
  );
};

export default ImageMessageItem;

const styles = StyleSheet.create({
  aiMessage: {
    flexDirection: 'row',
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  userMessage: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginVertical: 8,
    maxWidth: '75%',
    borderRadius: 8,
    backgroundColor: ColorPalette.seaBlueLight,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
  },
  generatedImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    borderRadius: 8,
    marginTop: 8,
  },
  aiMessageIconContainer: {
    backgroundColor: ColorPalette.seaBlueLight,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginHorizontal: 7,
  },
  closeButton: {
    borderRadius: 11,
    backgroundColor: ColorPalette.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
  },
  closeButtonRight: {
    marginLeft: 8,
  },
  closeButtonLeft: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: Platform.OS === 'ios' ? 16 : 14,
    color: '#000',
  },
});
