import React, { memo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Dimensions,
} from 'react-native';
import MarkdownComponent from './MarkdownComponent';
import ColorPalette from '../colors';

export interface ImageMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Base64 image data
  topText?: string; // Meme text for top of image
  bottomText?: string; // Meme text for bottom of image
}

interface ImageMessageItemProps {
  message: ImageMessage;
}

const { width: screenWidth } = Dimensions.get('window');

const ImageMessageItem = memo(({ message }: ImageMessageItemProps) => {
  return (
    <View
      style={
        message.role === 'assistant' ? styles.aiMessage : styles.userMessage
      }
    >
      <View style={styles.messageContent}>
        {message.content && !message.image && <MarkdownComponent text={message.content} />}
        {message.image && (
          <>
            {(message.topText || message.bottomText) && (
              <View style={styles.memeTextDisplay}>
                <Text style={styles.memeTextLabel}>Meme Text:</Text>
                <Text style={styles.memeTextContent}>
                  {message.topText && message.bottomText 
                    ? `${message.topText} ${message.bottomText}`
                    : message.topText || message.bottomText}
                </Text>
              </View>
            )}
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: message.image }}
                style={styles.generatedImage}
                resizeMode="contain"
              />
              {message.topText && (
                <Text style={styles.topMemeText}>{message.topText}</Text>
              )}
              {message.bottomText && (
                <Text style={styles.bottomMemeText}>{message.bottomText}</Text>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
});

export default ImageMessageItem;

const styles = StyleSheet.create({
  aiMessage: {
    flexDirection: 'row',
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginVertical: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
  },
  userMessage: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginVertical: 8,
    maxWidth: '75%',
    borderRadius: 12,
    backgroundColor: ColorPalette.backgroundCard,
    borderWidth: 1,
    borderColor: ColorPalette.accent,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
  },
  memeTextDisplay: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    marginBottom: 8,
  },
  memeTextLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ColorPalette.accent,
    marginBottom: 4,
    fontFamily: 'medium',
  },
  memeTextContent: {
    fontSize: 14,
    color: ColorPalette.textPrimary,
    lineHeight: 20,
    fontFamily: 'regular',
  },
  imageContainer: {
    position: 'relative',
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
  },
  generatedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  topMemeText: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 5,
  },
  bottomMemeText: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 5,
  },
});
