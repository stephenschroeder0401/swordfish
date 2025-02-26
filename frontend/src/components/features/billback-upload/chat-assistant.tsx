import React, { useState } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  Flex,
  IconButton,
  useColorModeValue,
  Collapse,
  Divider,
} from '@chakra-ui/react';
import { ChatIcon, ChevronUpIcon, ChevronDownIcon, CloseIcon } from '@chakra-ui/icons';

interface Message {
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatAssistantProps {
  onSendMessage: (message: string) => Promise<string>;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(inputValue);
      const assistantMessage: Message = {
        text: response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      width={isOpen ? "400px" : "auto"}
      zIndex={1000}
    >
      <VStack spacing={0} align="stretch">
        <Flex
          justify="space-between"
          align="center"
          bg="blue.500"
          color="white"
          p={2}
          borderTopRadius="md"
          cursor="pointer"
          onClick={() => setIsOpen(!isOpen)}
          _hover={{ bg: 'blue.600' }}
        >
          <Flex align="center">
            <ChatIcon mr={2} />
            <Text fontWeight="medium">Chat Assistant</Text>
          </Flex>
          <Flex>
            {isOpen && (
              <IconButton
                aria-label="Clear chat"
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={(e) => {
                  e.stopPropagation();
                  clearChat();
                }}
                mr={2}
              />
            )}
            {isOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </Flex>
        </Flex>

        <Collapse in={isOpen}>
          <Box
            bg={bgColor}
            borderX="1px"
            borderBottom="1px"
            borderColor={borderColor}
            borderBottomRadius="md"
            shadow="md"
          >
            <Box
              height="300px"
              overflowY="auto"
              p={4}
              css={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'gray',
                  borderRadius: '24px',
                },
              }}
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  mb={4}
                  alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                >
                  <Flex
                    direction="column"
                    maxWidth="80%"
                    marginLeft={message.sender === 'user' ? 'auto' : '0'}
                  >
                    <Box
                      bg={message.sender === 'user' ? 'blue.500' : 'gray.100'}
                      color={message.sender === 'user' ? 'white' : 'black'}
                      p={3}
                      borderRadius="lg"
                      fontSize="sm"
                    >
                      {message.text}
                    </Box>
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      mt={1}
                      textAlign={message.sender === 'user' ? 'right' : 'left'}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Box>

            <Divider />

            <Flex p={2}>
              <Input
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                mr={2}
                disabled={isLoading}
              />
              <Button
                colorScheme="blue"
                onClick={handleSendMessage}
                isLoading={isLoading}
                loadingText="Sending"
              >
                Send
              </Button>
            </Flex>
          </Box>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default ChatAssistant; 