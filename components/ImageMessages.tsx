import { useRef, useEffect } from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import AnimatedChatLoading from './AnimatedChatLoading';
import ColorPalette from '../colors';
import ImageMessageItem, { ImageMessage } from './ImageMessageItem';

interface ImageMessagesComponentProps {
  chatHistory: ImageMessage[];
  llmResponse: string;
  isGenerating: boolean;
  isTextGenerating?: boolean;
  isImageGenerating?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export default function ImageMessages({
  chatHistory,
  llmResponse,
  isGenerating,
  isTextGenerating,
  isImageGenerating,
  currentStep,
  totalSteps,
}: ImageMessagesComponentProps) {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatHistory.length > 0 || isGenerating) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory.length, isGenerating]);

  const renderItem = ({ item }: { item: ImageMessage }) => (
    <ImageMessageItem message={item} />
  );

  const renderFooter = () => {
    if (!isGenerating) return null;

    let statusMessage = '';
    if (isTextGenerating) {
      statusMessage = llmResponse || 'Generating meme text...';
    } else if (isImageGenerating) {
      const stepInfo = currentStep && totalSteps ? ` ${currentStep}/${totalSteps}` : '';
      statusMessage = `Generating image...${stepInfo}`;
    }

    return (
      <View style={styles.aiMessage}>
        {!statusMessage ? (
          <View style={styles.messageLoadingContainer}>
            <AnimatedChatLoading />
          </View>
        ) : (
          <Text style={styles.messageText}>{statusMessage.trim()}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.chatContainer}>
      <FlatList
        ref={flatListRef}
        data={chatHistory}
        renderItem={renderItem}
        keyExtractor={(item, index) => `message-${index}`}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chatContainer: { 
    flex: 1, 
    width: '100%',
    paddingHorizontal: 8,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  aiMessage: {
    flexDirection: 'row',
    maxWidth: '80%',
    alignSelf: 'flex-start',
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  messageLoadingContainer: { 
    width: 28,
    marginTop: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19.6,
    color: ColorPalette.textSecondary,
    fontFamily: 'regular',
    marginTop: 6,
  },
});
