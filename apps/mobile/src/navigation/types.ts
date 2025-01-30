export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ConnectChannel: undefined;
  PlatformComparison: undefined;
  ManageConnections: undefined;
  Analytics: undefined;
  ContentCalendar: undefined;
  TeamManagement: undefined;
  PostInsights: {
    postId: string;
  };
  CreatePost: {
    platformId: string;
    editPostId?: string;
  };
  EditProfile: {
    profile?: {
      name?: string;
      bio?: string;
      picture?: string;
    };
  };
  Messages: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Analytics: undefined;
  ContentCalendar: undefined;
  Messages: undefined;
}; 