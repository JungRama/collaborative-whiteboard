const typeDefs = `#graphql
  scalar DateTime
  type Query {
    # Auth
    refreshAccessToken(refresh_token: String!): TokenResponse!
    logoutUser: Boolean!

    # User
    getMe: UserResponse!

    # Files
    getFiles(search: String): [File]!
    getFileById(id: String!, isPublic: Boolean!): File!
    getFavorites: [File]!
  }

  type Mutation {
    # Auth
    loginUser(input: LoginInput!): TokenResponse!
    signupUser(input: SignUpInput!): Boolean
    oAuth(input: OAuthInput!): TokenResponse!
    verifyAccount(input: verifyAccountInput!): TokenResponse!

    # Files
    createFile: File!
    addNewUserAccess(input: NewUserAccessInput!): [UserAccess]
    changeUserAccess(input: ChangeUserAccessInput!): [UserAccess]
    toogleFavorite(input: ToogleFavoriteInput!): [File]
    toogleIsPublic(input: ToogleIsPublicInput!): Boolean!
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

  input OAuthInput {
    strategy: String!
    code: String!
  }
  
  input NewUserAccessInput {
    id: String!
    email: String!
    role: String!
  }

  input ChangeUserAccessInput {
    id: String!
    user_id: String!
    role: String!
  }

  input verifyAccountInput {
    id: String
  }

  input ToogleFavoriteInput{
    id: String!
  }

  input ToogleIsPublicInput {
    id: String!
    value: Boolean!
  }
  
  type File {
    id: ID!
    name: String!
    isPublic: Boolean
    thumbnail: String
    whiteboard: String
    userAccess: [UserAccess!]!
    createdAt: DateTime
    updatedAt: DateTime
  }

  type UserAccess {
    userId: UserAccessDetail!
    role: String!
  }

  type UserAccessDetail {
    _id: String!
    name: String!
    email: String!
    photo: String
  }

  type TokenResponse {
    access_token: String!
    refresh_token: String!
  }

  type UserResponse {
    user: UserData!
  }

  type UserData {
    id: ID!
    name: String!
    email: String!
    role: String!
    photo: String
    createdAt: DateTime
    updatedAt: DateTime
  }
`

export default typeDefs
