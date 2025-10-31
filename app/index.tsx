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
import { useLLM, useTextToImage, BK_SDM_TINY_VPRED_256, LLAMA3_2_1B_SPINQUANT } from 'react-native-executorch';
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

const numSteps = 100; // Number of denoising steps

function LLMScreen() {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ImageMessage[]>([]);
  const textInputRef = useRef<TextInput>(null);
  const { setGlobalGenerating, setGenerationProgress } = useContext(GeneratingContext);

  // Total steps will be determined by the numSteps parameter in generate()
  const [totalGenerationSteps, setTotalGenerationSteps] = useState(numSteps); // Default to 16 as per your generate call

  // Initialize LLM for generating meme text
  const textLLM = useLLM({ model: LLAMA3_2_1B_SPINQUANT });

  console.log('textLLM', textLLM.response);

  // Configure LLM with system prompt for meme generation
  useEffect(() => {
    if (textLLM.isReady) {
      textLLM.configure({
        chatConfig: {
          contextWindowLength: 2048,
          systemPrompt: 'You are a creative meme text generator. Generate funny and catchy meme text based on the given prompt. Always respond with exactly two short lines separated by a pipe character (|). The first line is for the top of the meme, the second for the bottom. Keep each line under 6 words. Be witty, humorous, and relevant to the prompt. Example response format: "WHEN YOU REALIZE|IT\'S MONDAY AGAIN"',
          initialMessageHistory: [],
        },
      });
    }
  }, [textLLM.isReady]);

  // Initialize text-to-image model with custom configuration and inference callback
  const imageModel = useTextToImage({
    model: BK_SDM_TINY_VPRED_256,
    inferenceCallback: (stepIdx: number) => {
      // Track the generation progress
      setGenerationProgress(stepIdx, totalGenerationSteps);
      console.log(`Generation step: ${stepIdx}/${totalGenerationSteps}`);
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

  useEffect(() => {
    setGlobalGenerating(imageModel.isGenerating || textLLM.isGenerating);
  }, [imageModel.isGenerating, textLLM.isGenerating, setGlobalGenerating]);

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
      textLLM.sendMessage(prompt);

      const memeTextResponse = textLLM.response;
      console.log('Generated meme text:', textLLM.response);

      // Parse the meme text response (expecting format: "TOP TEXT|BOTTOM TEXT")
      let topText = '';
      let bottomText = '';

      if (memeTextResponse && memeTextResponse.includes('|')) {
        const parts = memeTextResponse.split('|');
        topText = parts[0].trim().replace(/"/g, '');
        bottomText = parts[1].trim().replace(/"/g, '');
      } else if (memeTextResponse) {
        // If no pipe separator, use the whole response as top text
        const cleanText = memeTextResponse.trim().replace(/"/g, '');
        const words = cleanText.split(' ');
        if (words.length > 6) {
          topText = words.slice(0, Math.ceil(words.length / 2)).join(' ');
          bottomText = words.slice(Math.ceil(words.length / 2)).join(' ');
        } else {
          topText = cleanText;
        }
      }

      // Reset generation step counter
      setTotalGenerationSteps(numSteps);
      setGenerationProgress(0, numSteps);

      // Generate image with custom parameters
      // Parameters: prompt, imageSize, numSteps, seed
      const image = await imageModel.generate("Hi, you are a helpful assistant, generate an image as per this prompt:\n" + prompt, 256, numSteps, -1);
      console.log('Generated image successfully');

      // Add assistant message with generated meme text
      const assistantMessage: ImageMessage = {
        role: 'assistant',
        content: memeTextResponse || 'Generated meme text', // Show the generated text
        image: `data:image/png;base64,${image}`, // Uncomment when using image model
        // topText: topText,
        // bottomText: bottomText,
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setGenerationProgress(0, 0); // Reset progress in context
    } catch (e) {
      console.error('Error generating:', e);
      // Add error message to chat
      const errorMessage: ImageMessage = {
        role: 'assistant',
        content: `Error generating: ${e instanceof Error ? e.message : 'Unknown error'}`,
      };
      setChatHistory(prev => [...prev, errorMessage]);
      setGenerationProgress(0, 0); // Reset progress in context
    }
  };

  const deleteMessage = (index: number) => {
    setChatHistory(prev => prev.filter((_, i) => i !== index));
  };

  return (!textLLM.isReady || !imageModel.isReady) ? (
    <Spinner
      visible
      textContent={`Loading models, please wait! \n\nImage Model: ${(imageModel.downloadProgress * 100).toFixed(0)}%\nText Model: ${(textLLM.downloadProgress * 100).toFixed(0)}%`}
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
                  Enter a prompt to generate a meme with AI-generated text and image
                </Text>
              </View>
            ) : (
              <ImageMessages
                chatHistory={chatHistory}
                llmResponse={textLLM.response}
                isGenerating={textLLM.isGenerating}
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
              placeholder="Describe your meme idea..."
              placeholderTextColor={'#C1C6E5'}
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
                <SendIcon height={24} width={24} padding={4} margin={8} />
              </TouchableOpacity>
            )}
            {textLLM.isGenerating && (
              <TouchableOpacity
                style={styles.sendChatTouchable}
                onPress={() => {
                  if (textLLM.isGenerating) textLLM.interrupt();
                }}
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
