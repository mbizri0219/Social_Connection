import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { SWRConfig } from 'swr';
import { api } from './src/services/api';
import { 
  useFonts,
  ChakraPetch_400Regular,
} from '@expo-google-fonts/chakra-petch';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Chakra-Petch': ChakraPetch_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SWRConfig 
      value={{
        fetcher: (url: string) => api.get(url).then(res => res.data),
        provider: () => new Map(),
      }}
    >
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
          <StatusBar style="light" />
        </SafeAreaProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
