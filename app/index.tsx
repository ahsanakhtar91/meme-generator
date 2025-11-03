import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import SendIcon from '../assets/icons/send_icon.svg';
import { useLLM, useTextToImage, BK_SDM_TINY_VPRED_512, LLAMA3_2_1B_SPINQUANT } from 'react-native-executorch';
import PauseIcon from '../assets/icons/pause_icon.svg';
import ColorPalette from '../colors';
import ImageMessages from '../components/ImageMessages';
import { ImageMessage } from '../components/ImageMessageItem';
import { useIsFocused } from '@react-navigation/native';
import Spinner from '../components/Spinner';

export default function LLMScreenWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <LLMScreen /> : null;
}

// const VERSION_TAG = 'resolve/v0.5.0';
// const URL_PREFIX = 'https://huggingface.co/software-mansion/react-native-executorch';
// const VERSION_TAG = 'resolve/main';

/*
const customModel = {
  // schedulerSource: require('./scheduler_config.json'), // If scheduler_config needs to be updated
  schedulerSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/scheduler/scheduler_config.json`, // https://huggingface.co/software-mansion/react-native-executorch-bk-sdm-tiny/resolve/main/scheduler/scheduler_config.json
  tokenizerSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/tokenizer/tokenizer.json`,
  encoderSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/text_encoder/model.pte`,
  unetSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/unet/model.pte`,
  decoderSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/vae/model.pte`,
  // unetSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/unet/model.256.pte`,
  // decoderSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/vae/model.256.pte`,
};
*/

const numSteps = 10; // Number of denoising steps

function LLMScreen() {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ImageMessage[]>([]);
  const textInputRef = useRef<TextInput>(null);
  const finalLLMResponseRef = useRef('');

  // Total steps will be determined by the numSteps parameter in generate()
  const [totalGenerationSteps, setTotalGenerationSteps] = useState(numSteps); // Default to 16 as per your generate call
  const [currentGenerationStep, setCurrentGenerationStep] = useState(0);

  // Initialize LLM for generating meme text
  const textLLM = useLLM({ model: LLAMA3_2_1B_SPINQUANT });

  // Configure LLM with system prompt for meme generation
  useEffect(() => {
    if (textLLM.isReady) {
      textLLM.configure({
        chatConfig: {
          contextWindowLength: 2048,
          systemPrompt: 'You are a creative meme text generator. Generate funny and catchy meme text based on the given prompt. Always respond with ONLY two short lines separated by a SINGLE pipe character (|). The first line is for the top of the meme, the second for the bottom. Keep each line under 6 words. Be witty, humorous, and relevant to the prompt. Do not include any extra pipes or formatting. Example response: WHEN YOU REALIZE|ITS MONDAY AGAIN',
          initialMessageHistory: [],
        },
      });
    }
  }, [textLLM.isReady]);

  // Track LLM response and generation state
  useEffect(() => {
    if (textLLM.isGenerating) {
      // Clear final response when starting new generation
      finalLLMResponseRef.current = '';
    } else if (!textLLM.isGenerating && textLLM.response) {
      // Set final response when generation is complete
      finalLLMResponseRef.current = textLLM.response;
    }
  }, [textLLM.isGenerating, textLLM.response]);

  // Initialize text-to-image model with custom configuration and inference callback
  const imageModel = useTextToImage({
    model: BK_SDM_TINY_VPRED_512,
    inferenceCallback: (stepIdx: number) => {
      // Track the generation progress
      setCurrentGenerationStep(stepIdx);
      console.log(`Image Generation Step ${stepIdx}/${totalGenerationSteps}`);
    }
  });

  useEffect(() => {
    if (imageModel.error) {
      console.log('Image model error:', imageModel.error);
    }
    if (textLLM.error) {
      console.log('Text LLM error:', textLLM.error);
    }
  }, [imageModel.error, textLLM.error]);

  useEffect(() => {
    console.log('Image model downloadProgress', imageModel.downloadProgress * 100);
    console.log('Text LLM downloadProgress', textLLM.downloadProgress * 100);
  }, [imageModel.downloadProgress, textLLM.downloadProgress]);

  const sendMessage = async () => {
    const prompt = userInput.trim();
    if (!prompt) return;

    // Add user message to chat history
    const userMessage: ImageMessage = {
      role: 'user',
      content: prompt,
    };

    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    textInputRef.current?.clear();

    try {
      // Start text generation
      await textLLM.sendMessage(prompt);

      // Wait for text generation to complete and final response to be set
      while (textLLM.isGenerating || !finalLLMResponseRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const memeTextResponse = finalLLMResponseRef.current;
      console.log('Generated meme text:', memeTextResponse);

      // Parse the meme text response (expecting format: "TOP TEXT|BOTTOM TEXT")
      let topText = '';
      let bottomText = '';

      if (memeTextResponse && memeTextResponse.includes('|')) {
        // Split by pipe and filter out empty parts
        const parts = memeTextResponse.split('|')
          .map(part => part.trim())
          .filter(part => part.length > 0);

        if (parts.length >= 2) {
          // Take first non-empty part as top text, last as bottom text
          topText = parts[0].replace(/["|']/g, '').toUpperCase();
          bottomText = parts[parts.length - 1].replace(/["|']/g, '').toUpperCase();
        } else if (parts.length === 1) {
          // If only one part, use it as top text
          topText = parts[0].replace(/["|']/g, '').toUpperCase();
        }
      } else if (memeTextResponse) {
        // If no pipe separator, use the whole response as top text
        const cleanText = memeTextResponse.trim().replace(/["|']/g, '');
        const words = cleanText.split(' ');
        if (words.length > 6) {
          topText = words.slice(0, Math.ceil(words.length / 2)).join(' ').toUpperCase();
          bottomText = words.slice(Math.ceil(words.length / 2)).join(' ').toUpperCase();
        } else {
          topText = cleanText.toUpperCase();
        }
      }

      // Reset generation step counter
      setTotalGenerationSteps(numSteps);
      setCurrentGenerationStep(0);

      // Generate image with custom parameters
      // Parameters: prompt, imageSize, numSteps, seed
      const image = await imageModel.generate(prompt, 512, numSteps, -1);
      console.log('Generated image successfully');

      // Add assistant message with generated meme text and image
      const assistantMessage: ImageMessage = {
        role: 'assistant',
        content: '', // Don't show raw response, we'll show formatted text instead
        image: `data:image/png;base64,${image}`,
        topText: topText,
        bottomText: bottomText,
      };

      setChatHistory(prev => [...prev, assistantMessage]);

      // Clear the final response and reset step counter for next generation
      finalLLMResponseRef.current = '';
      setCurrentGenerationStep(0);
    } catch (e) {
      console.error('Error generating:', e);
      // Add error message to chat
      const errorMessage: ImageMessage = {
        role: 'assistant',
        content: `Error generating: ${e instanceof Error ? e.message : 'Unknown error'}`,
      };
      setChatHistory(prev => [...prev, errorMessage]);

      // Clear the final response and reset step counter for next generation
      finalLLMResponseRef.current = '';
      setCurrentGenerationStep(0);
    }
  };

  return (!textLLM.isReady || !imageModel.isReady) ? (
    <Spinner
      visible
      imageProgress={imageModel.downloadProgress * 100}
      textProgress={textLLM.downloadProgress * 100}
    />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        collapsable={false}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 40}
      >
        <View style={styles.container}>
          {/* Chat Messages */}
          <View style={styles.chatContainer}>
            {chatHistory.length === 0 && !textLLM.isGenerating ? (
              <View style={styles.helloMessageContainer}>
                <Text style={styles.helloText}>Meme Generator</Text>
                <Text style={styles.bottomHelloText}>
                  Enter a prompt to generate a meme
                </Text>
                <Text style={styles.bottomHelloText}>
                  with AI-generated text and image
                </Text>
              </View>
            ) : (
              <ImageMessages
                chatHistory={chatHistory}
                llmResponse={textLLM.response}
                isGenerating={textLLM.isGenerating || imageModel.isGenerating}
                isTextGenerating={textLLM.isGenerating}
                isImageGenerating={imageModel.isGenerating}
                currentStep={currentGenerationStep}
                totalSteps={totalGenerationSteps}
              />
            )}
          </View>

          {/* Input Area */}
          <View style={styles.bottomContainer}>
            <TextInput
              autoCorrect={false}
              onFocus={() => setIsTextInputFocused(true)}
              onBlur={() => setIsTextInputFocused(false)}
              style={{
                ...styles.textInput,
                borderColor: isTextInputFocused
                  ? ColorPalette.accent
                  : 'rgba(0, 212, 255, 0.3)',
              }}
              placeholder="Describe your meme idea..."
              placeholderTextColor={ColorPalette.textMuted}
              multiline={true}
              ref={textInputRef}
              onChangeText={(text: string) => setUserInput(text)}
              editable={!textLLM.isGenerating}
            />
            {userInput && !textLLM.isGenerating && (
              <TouchableOpacity
                style={styles.sendChatTouchable}
                onPress={sendMessage}
              >
                <SendIcon height={24} width={24} padding={4} margin={8} fill={ColorPalette.accent} />
              </TouchableOpacity>
            )}
            {textLLM.isGenerating && (
              <TouchableOpacity
                style={styles.sendChatTouchable}
                onPress={() => {
                  if (textLLM.isGenerating) textLLM.interrupt();
                }}
              >
                <PauseIcon height={24} width={24} padding={4} margin={8} fill={ColorPalette.accent} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: ColorPalette.background,
  },
  chatContainer: {
    flex: 10,
    width: '100%',
    backgroundColor: ColorPalette.background,
  },
  helloMessageContainer: {
    flex: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    fontFamily: 'medium',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: ColorPalette.accent,
  },
  bottomHelloText: {
    fontFamily: 'regular',
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
    color: ColorPalette.textSecondary,
    paddingHorizontal: 20,
  },
  bottomContainer: {
    height: 100,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 212, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 24,
    lineHeight: 19.6,
    fontFamily: 'regular',
    fontSize: 14,
    color: ColorPalette.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendChatTouchable: {
    height: '100%',
    width: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
