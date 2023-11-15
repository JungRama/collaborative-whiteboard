const typeDefs = `#graphql
  scalar DateTime
  type Query {
    # Auth
    refreshAccessToken(refresh_token: String!): TokenResponse!
    logoutUser: Boolean!

    # User
    getMe: UserResponse!

    # Files
    getFiles(search: String): [File!]!
  }

  type Mutation {
    # Auth
    loginUser(input: LoginInput!): TokenResponse!
    signupUser(input: SignUpInput!): UserResponse!

    # Files
    createFile: File!
    updateFile(input: UpdateFileInput!): File!
    deleteFile(input: DeleteFileInput!): Boolean
  }

  input UpdateFileInput {
    id: String!
    name: String
    thumbnail: String
    whiteboard: String
  }
  
  input DeleteFileInput {
    id: String!
  }

  input SignUpInput {
    name: String!
    email: String!
    password: String!
    passwordConfirm: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }
  
  type File {
    id: ID!
    name: String!
    thumbnail: String
    whiteboard: String
    userAccess: [UserAccess!]!
    createdAt: DateTime
    updatedAt: DateTime
  }

  type UserAccess {
    userId: String!
    role: String!
  }

  type TokenResponse {
    status: String!
    access_token: String!
    refresh_token: String!
  }

  type UserResponse {
    status: String!
    user: UserData!
  }

  type UserData {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: DateTime
    updatedAt: DateTime
  }
`

export default typeDefs
