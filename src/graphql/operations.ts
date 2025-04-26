
import { gql } from '@apollo/client';

// --- Live Match ---

export const SUBSCRIBE_LIVE_MATCH = gql`
  subscription SubscribeLiveMatch {
    live_match(limit: 1) {
      team1
      team1_set_score
      team1_current_points
      team2
      team2_set_score
      team2_current_points
      status
      match_type
    }
  }
`;

// Assuming 'live_match' is a singleton table or a table with a fixed ID (e.g., 1)
// Adjust the mutation based on your actual Hasura schema setup (e.g., using a fixed ID or specific constraints)
export const UPDATE_LIVE_MATCH = gql`
  mutation UpdateLiveMatch($object: live_match_insert_input!) {
    insert_live_match_one(
      object: $object,
      on_conflict: {
        constraint: live_match_pkey, # Adjust constraint name if different
        update_columns: [
          team1, team1_set_score, team1_current_points,
          team2, team2_set_score, team2_current_points,
          status, match_type
        ]
      }
    ) {
      team1 # Return some data to confirm success
    }
  }
`;

export const CLEAR_LIVE_MATCH = gql`
  mutation ClearLiveMatch {
    # Option 1: Delete the row (if using a singleton approach with insert/delete)
    # delete_live_match(where: {}) {
    #   affected_rows
    # }

    # Option 2: Update the row to default/empty values
    update_live_match(
        where: {}, # Update the single row (adjust if using specific IDs)
        _set: {
            team1: "", team1_set_score: 0, team1_current_points: 0,
            team2: "", team2_set_score: 0, team2_current_points: 0,
            status: "", match_type: ""
        }
    ) {
         affected_rows
    }
  }
`;


// --- Standings ---

export const SUBSCRIBE_STANDINGS = gql`
  subscription SubscribeStandings {
    standings(order_by: { group_key: asc, points: desc, break_points: desc, name: asc }) {
      group_key
      name
      matches_played
      wins
      losses
      sets_won
      sets_lost
      points
      break_points
    }
  }
`;

// Mutation to update standings - this often requires an "upsert" operation.
// Assumes 'standings' table has a composite primary key or unique constraint on (group_key, name)
// Adjust the constraint name as needed.
export const UPSERT_STANDINGS = gql`
  mutation UpsertStandings($objects: [standings_insert_input!]!) {
    insert_standings(
      objects: $objects,
      on_conflict: {
        constraint: standings_pkey, # Adjust constraint name (e.g., standings_group_key_name_key)
        update_columns: [matches_played, wins, losses, sets_won, sets_lost, points, break_points]
      }
    ) {
      affected_rows
    }
  }
`;
