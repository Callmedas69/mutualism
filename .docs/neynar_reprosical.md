# Fetch channels that user is active in

> Fetches all channels that a user has casted in, in reverse chronological order.

## Node.js SDK

🔗 **SDK Method:** [fetchUsersActiveChannels](/nodejs-sdk/channel-apis/fetchUsersActiveChannels)

Use this API endpoint with the Neynar Node.js SDK for typed responses and better developer experience.


## OpenAPI

````yaml get /v2/farcaster/channel/user/
openapi: 3.0.4
info:
  title: Neynar API
  version: 3.119.0
  description: >-
    The Neynar API allows you to interact with the Farcaster protocol among
    other things. See the [Neynar docs](https://docs.neynar.com/reference) for
    more details.
  contact:
    name: Neynar
    url: https://neynar.com/
    email: team@neynar.com
servers:
  - url: https://api.neynar.com
security:
  - ApiKeyAuth: []
tags:
  - name: User
    description: Operations related to user
    externalDocs:
      description: More info about user
      url: https://docs.neynar.com/reference/user-operations
  - name: Signer
    description: Operations related to signer
    externalDocs:
      description: More info about signer
      url: https://docs.neynar.com/reference/signer-operations
  - name: Cast
    description: Operations related to cast
    externalDocs:
      description: More info about cast
      url: https://docs.neynar.com/reference/cast-operations
  - name: Feed
    description: Operations related to feed
    externalDocs:
      description: More info about feed
      url: https://docs.neynar.com/reference/feed-operations
  - name: Reaction
    description: Operations related to reaction
    externalDocs:
      description: More info about reaction
      url: https://docs.neynar.com/reference/reaction-operations
  - name: Notifications
    description: Operations related to notifications
    externalDocs:
      description: More info about notifications
      url: https://docs.neynar.com/reference/notifications-operations
  - name: Channel
    description: Operations related to channels
    externalDocs:
      description: More info about channels
      url: https://docs.neynar.com/reference/channel-operations
  - name: Follows
    description: Operations related to follows
    externalDocs:
      description: More info about follows
      url: https://docs.neynar.com/reference/follows-operations
  - name: Storage
    description: Operations related to storage
    externalDocs:
      description: More info about storage
      url: https://docs.neynar.com/reference/storage-operations
  - name: Frame
    description: Operations related to mini apps
  - name: Agents
    description: Operations for building AI agents
  - name: fname
    description: Operations related to fname
  - name: Webhook
    description: Operations related to a webhook
  - name: Action
    description: >-
      Securely communicate and perform actions on behalf of users across
      different apps
    externalDocs:
      description: More info about farcaster actions
      url: https://docs.neynar.com/docs/farcaster-actions-spec
  - name: Subscribers
    description: Operations related to a subscriptions
  - name: Mute
    description: Operations related to a mute
  - name: Block
    description: Operations related to a block
  - name: Ban
    description: Operations related to a ban
  - name: Onchain
    description: Operations related to onchain data
  - name: Login
    description: Operations related to login
  - name: Metrics
    description: Operations related to retrieving metrics
  - name: App Host
    description: Operations related to mini app host notifications
    externalDocs:
      description: More info about mini app host notifications
      url: https://docs.neynar.com/docs/app-host-notifications
paths:
  /v2/farcaster/channel/user/:
    get:
      tags:
        - Channel
      summary: Fetch channels that user is active in
      description: >-
        Fetches all channels that a user has casted in, in reverse chronological
        order.
      operationId: fetch-users-active-channels
      parameters:
        - name: fid
          in: query
          description: The user's FID (identifier)
          required: true
          schema:
            type: integer
            minimum: 1
        - name: limit
          in: query
          description: Number of results to fetch
          schema:
            default: 20
            type: integer
            minimum: 1
            maximum: 100
            format: int32
          x-is-limit-param: true
        - name: cursor
          in: query
          description: Pagination cursor.
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UsersActiveChannelsResponse'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorRes'
        '404':
          description: Resource not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorRes'
      externalDocs:
        url: https://docs.neynar.com/reference/fetch-users-active-channels
components:
  schemas:
    UsersActiveChannelsResponse:
      type: object
      properties:
        channels:
          type: array
          items:
            $ref: '#/components/schemas/Channel'
        next:
          $ref: '#/components/schemas/NextCursor'
      title: UsersActiveChannelsResponse
    ErrorRes:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        property:
          type: string
        status:
          type: integer
          format: int32
      required:
        - message
      title: ErrorRes
      description: Details for the error response
    Channel:
      type: object
      properties:
        id:
          type: string
        url:
          type: string
        name:
          type: string
        description:
          type: string
        object:
          type: string
          enum:
            - channel
        created_at:
          $ref: '#/components/schemas/Timestamp'
        follower_count:
          type: number
          description: Number of followers the channel has.
        external_link:
          type: object
          properties:
            title:
              type: string
            url:
              type: string
          description: Channel's external link.
        image_url:
          type: string
        parent_url:
          type: string
          format: uri
        lead:
          $ref: '#/components/schemas/User'
        moderator_fids:
          type: array
          items:
            $ref: '#/components/schemas/Fid'
        member_count:
          type: integer
          format: int32
        moderator:
          description: Use `lead` instead.
          deprecated: true
          allOf:
            - $ref: '#/components/schemas/User'
        pinned_cast_hash:
          type: string
          pattern: ^(0x)?[a-fA-F0-9]{40}$
          example: '0x71d5225f77e0164388b1d4c120825f3a2c1f131c'
        hosts:
          type: array
          items:
            $ref: '#/components/schemas/User'
          deprecated: true
        viewer_context:
          $ref: '#/components/schemas/ChannelUserContext'
        description_mentioned_profiles:
          type: array
          items:
            $ref: '#/components/schemas/UserDehydrated'
        description_mentioned_profiles_ranges:
          type: array
          items:
            $ref: '#/components/schemas/TextRange'
          description: >-
            Positions within the text (inclusive start, exclusive end) where
            each mention occurs.
      required:
        - id
        - url
        - object
        - created_at
      title: Channel
    NextCursor:
      type: object
      properties:
        cursor:
          type: string
          nullable: true
      required:
        - cursor
      description: Returns next cursor
      title: NextCursor
    Timestamp:
      type: string
      format: date-time
      title: Timestamp
    User:
      type: object
      properties:
        object:
          type: string
          enum:
            - user
        fid:
          $ref: '#/components/schemas/Fid'
        username:
          type: string
        display_name:
          type: string
        custody_address:
          $ref: '#/components/schemas/EthAddress'
        pro:
          type: object
          properties:
            status:
              type: string
              enum:
                - subscribed
                - unsubscribed
              description: The subscription status of the user
            subscribed_at:
              $ref: '#/components/schemas/Timestamp'
            expires_at:
              $ref: '#/components/schemas/Timestamp'
          required:
            - status
            - subscribed_at
            - expires_at
        pfp_url:
          type: string
          description: The URL of the user's profile picture
        profile:
          type: object
          properties:
            bio:
              type: object
              properties:
                text:
                  type: string
                mentioned_profiles:
                  type: array
                  items:
                    $ref: '#/components/schemas/UserDehydrated'
                mentioned_profiles_ranges:
                  type: array
                  items:
                    $ref: '#/components/schemas/TextRange'
                  description: >-
                    Positions within the text (inclusive start, exclusive end)
                    where each mention occurs.

                    Each index within this list corresponds to the same-numbered
                    index in the mentioned_profiles list.
                mentioned_channels:
                  type: array
                  items:
                    $ref: '#/components/schemas/ChannelDehydrated'
                mentioned_channels_ranges:
                  type: array
                  items:
                    $ref: '#/components/schemas/TextRange'
                  description: >-
                    Positions within the text (inclusive start, exclusive end)
                    where each mention occurs.

                    Each index within this list corresponds to the same-numbered
                    index in the mentioned_channels list.
              required:
                - text
            location:
              $ref: '#/components/schemas/Location'
            banner:
              type: object
              properties:
                url:
                  type: string
                  format: uri
                  description: The URL of the user's banner image
          required:
            - bio
        follower_count:
          type: integer
          format: int32
          description: The number of followers the user has.
        following_count:
          type: integer
          format: int32
          description: The number of users the user is following.
        verifications:
          type: array
          items:
            $ref: '#/components/schemas/EthAddress'
        auth_addresses:
          type: array
          items:
            type: object
            properties:
              address:
                $ref: '#/components/schemas/EthAddress'
              app:
                $ref: '#/components/schemas/UserDehydrated'
            required:
              - address
              - app
        verified_addresses:
          type: object
          properties:
            eth_addresses:
              type: array
              items:
                $ref: '#/components/schemas/EthAddress'
              description: >-
                List of verified Ethereum addresses of the user sorted by oldest
                to most recent.
            sol_addresses:
              type: array
              items:
                $ref: '#/components/schemas/SolAddress'
              description: >-
                List of verified Solana addresses of the user sorted by oldest
                to most recent.
            primary:
              type: object
              properties:
                eth_address:
                  nullable: true
                  allOf:
                    - $ref: '#/components/schemas/EthAddress'
                sol_address:
                  nullable: true
                  allOf:
                    - $ref: '#/components/schemas/SolAddress'
              required:
                - eth_address
                - sol_address
          required:
            - eth_addresses
            - sol_addresses
            - primary
        verified_accounts:
          type: array
          items:
            type: object
            properties:
              platform:
                type: string
                enum:
                  - x
                  - github
              username:
                type: string
            description: >-
              Verified accounts of the user on other platforms, currently only X
              is supported.
        experimental:
          type: object
          properties:
            deprecation_notice:
              type: string
            neynar_user_score:
              type: number
              format: double
              description: >-
                Score that represents the probability that the account is not
                spam.
          required:
            - neynar_user_score
        viewer_context:
          $ref: '#/components/schemas/UserViewerContext'
        score:
          type: number
          format: double
          description: Score that represents the probability that the account is not spam.
      required:
        - object
        - fid
        - username
        - custody_address
        - profile
        - follower_count
        - following_count
        - verifications
        - auth_addresses
        - verified_addresses
        - verified_accounts
      title: User
    Fid:
      type: integer
      minimum: 0
      description: The unique identifier of a farcaster user or app (unsigned integer)
      example: 3
      title: Fid
      format: int32
    ChannelUserContext:
      type: object
      properties:
        following:
          type: boolean
          description: Indicates if the user is following the channel.
        role:
          $ref: '#/components/schemas/ChannelMemberRole'
      required:
        - following
      description: Adds context on the viewer's or author's role in the channel.
      title: ChannelUserContext
    UserDehydrated:
      type: object
      properties:
        object:
          type: string
          enum:
            - user_dehydrated
        fid:
          $ref: '#/components/schemas/Fid'
        username:
          type: string
        display_name:
          type: string
        pfp_url:
          type: string
        custody_address:
          $ref: '#/components/schemas/EthAddress'
        score:
          type: number
      required:
        - object
        - fid
      title: UserDehydrated
    TextRange:
      type: object
      properties:
        start:
          type: number
          minimum: 0
        end:
          type: number
          minimum: 0
      required:
        - start
        - end
      title: TextRange
    EthAddress:
      type: string
      pattern: ^0x[a-fA-F0-9]{40}$
      example: '0x5a927ac639636e534b678e81768ca19e2c6280b7'
      description: Ethereum address
      title: EthAddress
    ChannelDehydrated:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        object:
          type: string
          enum:
            - channel_dehydrated
        image_url:
          type: string
        viewer_context:
          $ref: '#/components/schemas/ChannelUserContext'
      required:
        - id
        - name
        - object
      title: ChannelDehydrated
    Location:
      type: object
      properties:
        latitude:
          type: number
          minimum: -90
          maximum: 90
          format: double
        longitude:
          type: number
          minimum: -180
          maximum: 180
          format: double
        address:
          $ref: '#/components/schemas/LocationAddress'
        radius:
          type: number
          minimum: 0
          description: >-
            The radius in meters for the location search. Any location within
            this radius will be returned.
      required:
        - latitude
        - longitude
      description: Coordinates and place names for a location
      title: Location
    SolAddress:
      type: string
      pattern: ^[1-9A-HJ-NP-Za-km-z]{32,44}$
      description: Solana address
      title: SolAddress
    UserViewerContext:
      type: object
      properties:
        following:
          type: boolean
          description: Indicates if the viewer is following the user.
        followed_by:
          type: boolean
          description: Indicates if the viewer is followed by the user.
        blocking:
          type: boolean
          description: Indicates if the viewer is blocking the user.
        blocked_by:
          type: boolean
          description: Indicates if the viewer is blocked by the user.
      required:
        - following
        - followed_by
        - blocking
        - blocked_by
      description: Adds context on the viewer's follow relationship with the user.
      title: UserViewerContext
    ChannelMemberRole:
      type: string
      enum:
        - member
        - moderator
        - owner
      description: The role of a channel member
      title: ChannelMemberRole
    LocationAddress:
      type: object
      properties:
        city:
          type: string
        state:
          type: string
        state_code:
          type: string
        country:
          type: string
        country_code:
          type: string
      required:
        - city
        - country
      title: LocationAddress
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key
      description: API key to authorize requests
      x-default: NEYNAR_API_DOCS

````

---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.neynar.com/llms.txt