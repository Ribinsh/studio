
'use client'; // Mark this component as a Client Component

import type React from 'react';
import { AppProvider } from '@/context/AppContext';
import { ApolloProvider } from '@apollo/client';
import client from '@/lib/apollo-client';

interface ProvidersProps {
    children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ApolloProvider client={client}>
            <AppProvider>
                {children}
            </AppProvider>
        </ApolloProvider>
    );
};

export default Providers;
