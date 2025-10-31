import { useRef, useEffect } from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import AnimatedChatLoading from './AnimatedChatLoading';
import LlamaIcon from '../assets/icons/llama_icon.svg';
import ColorPalette from '../colors';
import ImageMessageItem, { ImageMessage } from './ImageMessageItem';

interface ImageMessagesComponentProps {
  chatHistory: ImageMessage[];
  llmResponse: string;
  isGenerating: boolean;
  deleteMessage: (index: number) => void;
}

export default function ImageMessages({
  chatHistory,
  llmResponse,
  isGenerating,
  deleteMessage,
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

  const renderItem = ({ item, index }: { item: ImageMessage; index: number }) => (
    <ImageMessageItem
      message={item}
      deleteMessage={() => deleteMessage(index)}
    />
  );

  const renderFooter = () => {
    if (!isGenerating) return null;

    return (
      <View style={styles.aiMessage}>
        <View style={styles.aiMessageIconContainer}>
          <LlamaIcon width={24} height={24} />
        </View>
        {!llmResponse ? (
          <View style={styles.messageLoadingContainer}>
            <AnimatedChatLoading />
          </View>
        ) : (
          <Text style={styles.messageText}> {llmResponse.trim()}</Text>
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
  },
  messageLoadingContainer: { 
    width: 28,
    marginTop: 4,
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
  messageText: {
    fontSize: 14,
    lineHeight: 19.6,
    color: ColorPalette.primary,
    fontFamily: 'regular',
    marginTop: 6,
  },
});
