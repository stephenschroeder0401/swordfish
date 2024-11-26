import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
  Box,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { supabase } from '../lib/supabase-client'; // adjust path as needed
import { ProtectedPage } from '../components/protected-page'; // adjust path as needed

export default function ChangePasswordPage() {
  return (
    <ProtectedPage>
      <ChangePassword />
    </ProtectedPage>
  );
}

function ChangePassword() {
  // ... rest of the component code from my previous answer ...
}
