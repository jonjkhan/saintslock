declare const __DEV__: boolean;

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY?: string;
    EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID?: string;
    EXPO_PUBLIC_ENABLE_MOCK_PREMIUM?: string;
    SAINTSLOCK_MONTHLY?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

