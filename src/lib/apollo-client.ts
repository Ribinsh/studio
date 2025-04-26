
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient as createWsClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import WebSocket from 'isomorphic-ws'; // Use isomorphic-ws for Node.js and browser compatibility


const httpUri = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT || '';
const wsUri = httpUri.replace(/^http/, 'ws');
const adminSecret = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || '';

const httpLink = new HttpLink({
  uri: httpUri,
  headers: {
    'x-hasura-admin-secret': adminSecret,
  },
});

const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(createWsClient({
  url: wsUri,
  connectionParams: {
    headers: {
      'x-hasura-admin-secret': adminSecret,
    },
  },
   webSocketImpl: WebSocket, // Pass WebSocket implementation
})) : null; // No WebSocket link on the server side for now

// The split function takes three parameters:
//
// * A function that's called for each operation to execute
// * The Link to use for an operation if the function returns a "truthy" value
// * The Link to use for an operation if the function returns a "falsy" value
const splitLink = typeof window !== 'undefined' && wsLink != null ? split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
) : httpLink; // Fallback to httpLink on server or if wsLink is null

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
   ssrMode: typeof window === 'undefined', // Enable SSR mode on the server
});

export default client;
