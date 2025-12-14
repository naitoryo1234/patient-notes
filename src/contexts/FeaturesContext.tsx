'use client';

import { createContext, useContext, ReactNode } from 'react';
import { features as defaultFeatures, type Features } from '@/config/features';

interface FeaturesContextType {
    features: Features;
}

const FeaturesContext = createContext<FeaturesContextType>({
    features: defaultFeatures,
});

interface FeaturesProviderProps {
    children: ReactNode;
    // We pass overrides from the server (fetched from DB)
    dbSettings: Record<string, unknown>;
}

export const FeaturesProvider = ({ children, dbSettings }: FeaturesProviderProps) => {
    // Merge default features (env vars) with DB settings
    // This allows DB settings to override env vars

    // Deep merge logic specific to our structure
    const mergedFeatures: Features = {
        ...defaultFeatures,
        plugins: {
            ...defaultFeatures.plugins,
            attachments: {
                ...defaultFeatures.plugins.attachments,
                // Check if specific key exists in DB settings, otherwise keep default
                // Key matches SYSTEM_SETTINGS_KEYS.PLUGIN_ATTACHMENTS_ENABLED in service
                enabled: typeof dbSettings['plugins.attachments.enabled'] === 'boolean'
                    ? dbSettings['plugins.attachments.enabled']
                    : defaultFeatures.plugins.attachments.enabled,
            }
        }
    };

    return (
        <FeaturesContext.Provider value={{ features: mergedFeatures }}>
            {children}
        </FeaturesContext.Provider>
    );
};

export const useFeatures = () => {
    const context = useContext(FeaturesContext);
    if (context === undefined) {
        throw new Error('useFeatures must be used within a FeaturesProvider');
    }
    return context;

};
