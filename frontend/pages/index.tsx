// "use client";
// import React, { useState } from "react";
// import { useToast } from "@chakra-ui/react";
// import {
//   Stack,
//   Text,
//   Select,
//   Button,
//   Textarea,
//   Flex,
//   Container,
// } from "@chakra-ui/react";

// import PhoneNumberInput from "../src/components/phone-number-input";

// export default function FormComponent() {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [voice, setVoice] = useState("");
//   const [prompt, setPrompt] = useState("");
//   const toast = useToast();

//   const handleSubmit = async () => {
//     try {
//       const response = await fetch("/api/calls", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ toNumber: phoneNumber, voice, prompt }),
//       });

//       if (!response.ok) {
//         throw new Error();
//       }

//       toast({
//         title: "Call initiated successfully.",
//         description: "We've started your prank call!",
//         status: "success",
//         duration: 5000,
//         isClosable: true,
//       });

//       setPhoneNumber("");
//       setVoice("");
//       setPrompt("");
//     } catch (error) {
//       toast({
//         title: "Failed to start the call.",
//         description: "Please check the phone number and try again.",
//         status: "error",
//         duration: 5000,
//         isClosable: true,
//       });
//     }
//   };

//   return (
//     <Container maxW="2xl">
//       <Flex
//         direction="column"
//         height="100vh"
//         justifyContent="center"
//         alignItems="center"
//       >
//         <Stack spacing={4} width="full" maxW="lg" textAlign="center">
//           <Text fontSize="6xl" fontWeight="bold">
//             PrankGPT
//           </Text>
//           <Text fontSize="lg">
//             1. Enter the phone number of the person you want to prank
//           </Text>
//           <PhoneNumberInput
//             value={phoneNumber}
//             onChange={(e) => setPhoneNumber(e.target.value)}
//           />
//           <Text fontSize="lg">2. Choose your voice</Text>
//           <Select
//             width="75%"
//             placeholder="Select voice"
//             alignSelf="center"
//             value={voice}
//             onChange={(e) => setVoice(e.target.value)}
//           >
//             <option value="1">Marv (the OG evil prankbot)</option>
//             <option value="2">
//               Zephyr (the gen Z queen; voice by rime.ai!)
//             </option>
//           </Select>
//           <Text fontSize="lg">
//             3. Enter a prompt to instruct the AI with what to talk about
//           </Text>
//           <Textarea
//             placeholder="e.g. tell Ajay that he's been accepted to Hogwarts"
//             alignSelf="center"
//             value={prompt}
//             onChange={(e) => setPrompt(e.target.value)}
//           />
//           <Button
//             onClick={handleSubmit}
//             isDisabled={phoneNumber.length != 14 || !voice || !prompt}
//             alignSelf="center"
//             size="md"
//             width="40%"
//             colorScheme="blue"
//           >
//             Start call!
//           </Button>
//         </Stack>
//       </Flex>
//     </Container>
//   );
// }
