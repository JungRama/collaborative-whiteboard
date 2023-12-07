import { gql } from '@/codegen/gql';

export const SIGN_IN_MUTATION = gql(/* GraphQL */ `
  mutation Login($input: LoginInput!) {
    loginUser(input: $input) {
      access_token
      refresh_token
    }
  }
`);

export const SIGN_UP_MUTATION = gql(/* GraphQL */ `
  mutation SignUp($input: SignUpInput!) {
    signupUser(input: $input) {
      status
    }
  }
`);

export const GET_ME_QUERY = gql(/* GraphQL */ `
  query GetMe {
    getMe {
      user {
        createdAt
        email
        id
        name
        updatedAt
      }
    }
  }
`);
