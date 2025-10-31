import { useContext, useEffect, useRef, useState } from 'react';
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
import { useLLM, useTextToImage, BK_SDM_TINY_VPRED_256 } from 'react-native-executorch';
import PauseIcon from '../assets/icons/pause_icon.svg';
import ColorPalette from '../colors';
import ImageMessages from '../components/ImageMessages';
import { ImageMessage } from '../components/ImageMessageItem';
import { useIsFocused } from '@react-navigation/native';
import { GeneratingContext } from '../context';
import Spinner from '../components/Spinner';

export default function LLMScreenWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <LLMScreen /> : null;
}

const URL_PREFIX = 'https://huggingface.co/software-mansion/react-native-executorch';
// const VERSION_TAG = 'resolve/v0.5.0';
const VERSION_TAG = 'resolve/main';

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

function LLMScreen() {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ImageMessage[]>([]);
  const [llmResponse, setLlmResponse] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const { setGlobalGenerating, setGenerationProgress } = useContext(GeneratingContext);

  // State for tracking generation progress
  const [generationStep, setGenerationStep] = useState(0);

  // Total steps will be determined by the numSteps parameter in generate()
  const [totalGenerationSteps, setTotalGenerationSteps] = useState(16); // Default to 16 as per your generate call

  // Initialize text-to-image model with custom configuration and inference callback
  const llm = useTextToImage({
    model: customModel,
    inferenceCallback: (stepIdx: number) => {
      // Track the generation progress
      setGenerationStep(stepIdx);
      setGenerationProgress(stepIdx, totalGenerationSteps);
      console.log(`Generation step: ${stepIdx}/${totalGenerationSteps}`);
    }
  });


  useEffect(() => {
    if (llm.error) {
      console.log('LLM error:', llm.error);
    }
  }, [llm.error]);

  useEffect(() => {
    console.log('downloadProgress', llm.downloadProgress * 100);
  }, [llm.downloadProgress]);

  useEffect(() => {
    setGlobalGenerating(llm.isGenerating);
  }, [llm.isGenerating, setGlobalGenerating]);

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
      // Reset generation step counter
      setGenerationStep(0);
      const numSteps = 16; // Number of denoising steps
      setTotalGenerationSteps(numSteps);
      setGenerationProgress(0, numSteps);

      // Set generating state with dynamic progress
      setLlmResponse('Generating image...');

      // Generate image with custom parameters
      // Parameters: prompt, imageSize, numSteps, seed
      const image = await llm.generate("Hi, you are a helpful assistant, generate an image as per this prompt:\n" + prompt, 256, numSteps, 1234);
      console.log('Generated image successfully');

      // Add assistant message with generated imag3e
      const assistantMessage: ImageMessage = {
        role: 'assistant',
        content: '', // Empty content for image-only response
        image: `data:image/png;base64,${image}`,
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setLlmResponse('');
      setGenerationStep(0); // Reset step counter
      setGenerationProgress(0, 0); // Reset progress in context
    } catch (e) {
      console.error('Error generating image:', e);
      // Add error message to chat
      const errorMessage: ImageMessage = {
        role: 'assistant',
        content: `Error generating image: ${e instanceof Error ? e.message : 'Unknown error'}`,
      };
      setChatHistory(prev => [...prev, errorMessage]);
      setLlmResponse('');
      setGenerationStep(0);
      setGenerationProgress(0, 0); // Reset progress in context
    }
  };

  const deleteMessage = (index: number) => {
    setChatHistory(prev => prev.filter((_, i) => i !== index));
  };

  return !llm.isReady ? (
    <Spinner
      visible={!llm.isReady}
      textContent={`Loading the model ${(llm.downloadProgress * 100).toFixed(0)} %`}
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
            {chatHistory.length === 0 && !llm.isGenerating ? (
              <View style={styles.helloMessageContainer}>
                <Text style={styles.helloText}>Text to Image Generator</Text>
                <Text style={styles.bottomHelloText}>
                  Enter a prompt below to generate an image
                </Text>
              </View>
            ) : (
              <ImageMessages
                chatHistory={chatHistory}
                llmResponse={llmResponse}
                isGenerating={llm.isGenerating}
                deleteMessage={deleteMessage}
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
                  ? ColorPalette.blueDark
                  : ColorPalette.blueLight,
              }}
              placeholder="Describe the image you want to generate..."
              placeholderTextColor={'#C1C6E5'}
              multiline={true}
              ref={textInputRef}
              onChangeText={(text: string) => setUserInput(text)}
              editable={!llm.isGenerating}
            />
            {userInput && !llm.isGenerating && (
              <TouchableOpacity
                style={styles.sendChatTouchable}
                onPress={sendMessage}
              >
                <SendIcon height={24} width={24} padding={4} margin={8} />
              </TouchableOpacity>
            )}
            {llm.isGenerating && (
              <TouchableOpacity
                style={styles.sendChatTouchable}
                onPress={llm.interrupt}
              >
                <PauseIcon height={24} width={24} padding={4} margin={8} />
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
  container: { flex: 1 },
  chatContainer: { flex: 10, width: '100%' },
  helloMessageContainer: {
    flex: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    fontFamily: 'medium',
    fontSize: 23,
    color: ColorPalette.primary,
  },
  bottomHelloText: {
    fontFamily: 'regular',
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
    color: ColorPalette.primary,
  },
  bottomContainer: {
    height: 100,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    lineHeight: 19.6,
    fontFamily: 'regular',
    fontSize: 14,
    color: ColorPalette.primary,
    padding: 16,
  },
  sendChatTouchable: {
    height: '100%',
    width: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
