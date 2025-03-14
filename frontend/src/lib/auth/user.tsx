import { createClient as createAuthClient } from "../supabase/component";
import { supabase } from '../data-access/supabase-client';

interface UserSessionData {
    clientId: string;
    userId: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  }
  
  interface UserAccountResponse {
    client_id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    role: {
      name: string;
    };
  }
  
  export const authClient = createAuthClient();
  
  export const setUserSession = (data: UserSessionData) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('userSession', JSON.stringify(data));
    }
  };
  
  export const getUserSession = async (): Promise<UserSessionData | null> => {
    try {
      // First check sessionStorage
      const storedSession = sessionStorage.getItem('userSession');
      if (storedSession) {
        return JSON.parse(storedSession);
      }

      // If no stored session, check Supabase session
      const { data: { session } } = await authClient.auth.getSession();
      if (!session) {
        return null;
      }

      // Get user data and set up session
      const { data: userData, error: userError } = await supabase
        .from('user_account')
        .select(`
          client_id,
          user_id,
          first_name,
          last_name,
          role:role_id (
            name
          )
        `)
        .eq('user_id', session.user.id)
        .single() as { data: UserAccountResponse, error: any };

      if (userError) throw userError;

      const sessionData = {
        clientId: userData.client_id,
        userId: session.user.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role.name,
        email: session.user.email
      };

      // Store the session data
      setUserSession(sessionData);

      return sessionData;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  };
  
  export const clearUserSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('userSession');
    }
  };
  
  export const loginUser = async (email: string, password: string) => {
    try {
      const { data: { session }, error } = await authClient.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;

      const { data: userData, error: userError } = await supabase
        .from('user_account')
        .select(`
          client_id,
          user_id,
          first_name,
          last_name,
          role:role_id (
            name
          )
        `)
        .eq('user_id', session.user.id)
        .single() as { data: UserAccountResponse, error: any };

      if (userError) throw userError;

      const sessionData = {
        clientId: userData.client_id,
        userId: session.user.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role.name,
        email: session.user.email
      };

      setUserSession(sessionData);

      await authClient.auth.updateUser({
        data: { 
          client_id: userData.client_id,
          role: userData.role.name,
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      });

      return { session, userData };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  export const logoutUser = async () => {
    try {
      await authClient.auth.signOut();
      clearUserSession();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };
  
  export const updateUserPassword = async (password: string) => {
    try {
      const { data, error } = await authClient.auth.updateUser({
        password: password
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  };
  
  export const loginWithToken = async (accessToken: string, refreshToken: string) => {
    try {

      console.log("")
      const { data: { session }, error } = await authClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) throw error;

      const { data: userData, error: userError } = await supabase
        .from('user_account')
        .select(`
          client_id,
          user_id,
          first_name,
          last_name,
          role:role_id (
            name
          )
        `)
        .eq('user_id', session.user.id)
        .single() as { data: UserAccountResponse, error: any };

      if (userError) throw userError;

      const sessionData = {
        clientId: userData.client_id,
        userId: session.user.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role.name,
        email: session.user.email
      };

      setUserSession(sessionData);

      return { session, userData };
    } catch (error) {
      console.error('Token login error:', error);
      throw error;
    }
  };
  



  