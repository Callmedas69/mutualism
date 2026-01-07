# User interactions

> Returns a list of interactions between two users

## Node.js SDK

🔗 **SDK Method:** [fetchUserInteractions](/nodejs-sdk/agent-apis/fetchUserInteractions)

Use this API endpoint with the Neynar Node.js SDK for typed responses and better developer experience.


## OpenAPI

````yaml get /v2/farcaster/user/interactions/
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
  /v2/farcaster/user/interactions/:
    get:
      tags:
        - Agents
      summary: User interactions
      description: Returns a list of interactions between two users
      operationId: fetch-user-interactions
      parameters:
        - name: fids
          in: query
          description: Comma separated list of two FIDs
          required: true
          schema:
            type: string
            x-accept-as: integer
            x-comma-separated: true
            example: 194, 191
        - name: type
          in: query
          description: Comma seperated list of Interaction type to fetch
          schema:
            type: array
            items:
              type: string
              enum:
                - follows
                - recasts
                - likes
                - mentions
                - replies
                - quotes
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  interactions:
                    type: array
                    items:
                      $ref: '#/components/schemas/Notification'
                required:
                  - interactions
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorRes'
      externalDocs:
        url: https://docs.neynar.com/reference/fetch-user-interactions
components:
  schemas:
    Notification:
      type: object
      properties:
        object:
          type: string
          enum:
            - notification
        most_recent_timestamp:
          type: string
          format: date-time
        type:
          type: string
          enum:
            - follows
            - recasts
            - likes
            - mention
            - reply
            - quote
        seen:
          type: boolean
        follows:
          type: array
          items:
            $ref: '#/components/schemas/Follower'
        cast:
          $ref: '#/components/schemas/Cast'
        reactions:
          type: array
          items:
            $ref: '#/components/schemas/ReactionWithUserInfo'
        count:
          type: integer
          description: >-
            The number of notifications of this(follows, likes, recast) type
            bundled in a single notification.
          format: int32
      required:
        - object
        - most_recent_timestamp
        - type
        - seen
      title: Notification
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
    Follower:
      type: object
      properties:
        object:
          type: string
          enum:
            - follower
        app:
          $ref: '#/components/schemas/UserDehydrated'
        user:
          $ref: '#/components/schemas/User'
      required:
        - object
        - user
      title: Follower
    Cast:
      type: object
      properties:
        object:
          type: string
          enum:
            - cast
        hash:
          type: string
        parent_hash:
          type: string
          nullable: true
        parent_url:
          type: string
          nullable: true
        root_parent_url:
          type: string
          nullable: true
        parent_author:
          type: object
          properties:
            fid:
              nullable: true
              allOf:
                - $ref: '#/components/schemas/Fid'
          required:
            - fid
        author:
          $ref: '#/components/schemas/User'
        app:
          nullable: true
          allOf:
            - $ref: '#/components/schemas/UserDehydrated'
        text:
          type: string
        timestamp:
          $ref: '#/components/schemas/Timestamp'
        embeds:
          type: array
          items:
            $ref: '#/components/schemas/Embed'
        type:
          $ref: '#/components/schemas/CastNotificationType'
        reactions:
          $ref: '#/components/schemas/CastReactions'
        replies:
          $ref: '#/components/schemas/CastReplies'
        thread_hash:
          type: string
          nullable: true
        mentioned_profiles:
          type: array
          items:
            $ref: '#/components/schemas/User'
        mentioned_profiles_ranges:
          type: array
          items:
            $ref: '#/components/schemas/TextRange'
          description: >-
            Positions within the text (inclusive start, exclusive end) where
            each mention occurs.

            Each index within this list corresponds to the same-numbered index
            in the mentioned_profiles list.
        mentioned_channels:
          type: array
          items:
            $ref: '#/components/schemas/ChannelDehydrated'
        mentioned_channels_ranges:
          type: array
          items:
            $ref: '#/components/schemas/TextRange'
          description: >-
            Positions within the text (inclusive start, exclusive end) where
            each mention occurs.

            Each index within this list corresponds to the same-numbered index
            in the mentioned_channels list.
        channel:
          nullable: true
          allOf:
            - $ref: '#/components/schemas/ChannelOrChannelDehydrated'
        viewer_context:
          $ref: '#/components/schemas/CastViewerContext'
        author_channel_context:
          $ref: '#/components/schemas/ChannelUserContext'
      required:
        - object
        - hash
        - parent_hash
        - parent_url
        - root_parent_url
        - parent_author
        - author
        - text
        - timestamp
        - embeds
        - reactions
        - replies
        - thread_hash
        - mentioned_profiles
        - mentioned_profiles_ranges
        - mentioned_channels
        - mentioned_channels_ranges
        - channel
      title: Cast
    ReactionWithUserInfo:
      type: object
      properties:
        object:
          type: string
          enum:
            - likes
            - recasts
        cast:
          $ref: '#/components/schemas/CastDehydrated'
        user:
          $ref: '#/components/schemas/User'
      required:
        - object
        - cast
        - user
      title: ReactionWithUserInfo
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
    Timestamp:
      type: string
      format: date-time
      title: Timestamp
    Embed:
      oneOf:
        - $ref: '#/components/schemas/EmbedCast'
        - $ref: '#/components/schemas/EmbedUrl'
      title: Embed
    CastNotificationType:
      type: string
      enum:
        - cast-mention
        - cast-reply
      description: The notification type of a cast.
      title: CastNotificationType
    CastReactions:
      type: object
      properties:
        likes:
          type: array
          items:
            $ref: '#/components/schemas/ReactionLike'
          description: >-
            This has been deprecated and will always be an empty array. The
            property will be removed in the future
          deprecated: true
        recasts:
          type: array
          items:
            $ref: '#/components/schemas/ReactionRecast'
          description: >-
            This has been deprecated and will always be an empty array. The
            property will be removed in the future
          deprecated: true
        likes_count:
          type: integer
          format: int32
        recasts_count:
          type: integer
          format: int32
      required:
        - likes
        - recasts
        - likes_count
        - recasts_count
      title: CastReactions
    CastReplies:
      type: object
      properties:
        count:
          type: integer
          format: int32
      required:
        - count
      title: CastReplies
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
    ChannelOrChannelDehydrated:
      discriminator:
        propertyName: object
        mapping:
          channel: '#/components/schemas/Channel'
          channel_dehydrated: '#/components/schemas/ChannelDehydrated'
      oneOf:
        - $ref: '#/components/schemas/Channel'
        - $ref: '#/components/schemas/ChannelDehydrated'
      title: ChannelOrChannelDehydrated
    CastViewerContext:
      type: object
      properties:
        liked:
          type: boolean
          description: Indicates if the viewer liked the cast.
        recasted:
          type: boolean
          description: Indicates if the viewer recasted the cast.
      required:
        - liked
        - recasted
      description: Adds context on interactions the viewer has made with the cast.
      title: CastViewerContext
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
    CastDehydrated:
      type: object
      properties:
        object:
          type: string
          enum:
            - cast_dehydrated
        hash:
          type: string
        author:
          $ref: '#/components/schemas/UserDehydrated'
        app:
          nullable: true
          allOf:
            - $ref: '#/components/schemas/UserDehydrated'
      required:
        - object
        - hash
      title: CastDehydrated
    EthAddress:
      type: string
      pattern: ^0x[a-fA-F0-9]{40}$
      example: '0x5a927ac639636e534b678e81768ca19e2c6280b7'
      description: Ethereum address
      title: EthAddress
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
    EmbedCast:
      type: object
      properties:
        cast_id:
          type: object
          properties:
            fid:
              $ref: '#/components/schemas/Fid'
            hash:
              type: string
          required:
            - fid
            - hash
          description: '[DEPRECATED: Use "cast" key instead]'
          deprecated: true
        cast:
          $ref: '#/components/schemas/CastEmbedded'
      required:
        - cast
      title: EmbedCast
    EmbedUrl:
      type: object
      properties:
        url:
          type: string
        metadata:
          $ref: '#/components/schemas/EmbedUrlMetadata'
      required:
        - url
      title: EmbedUrl
    ReactionLike:
      type: object
      properties:
        fid:
          $ref: '#/components/schemas/Fid'
        fname:
          type: string
      required:
        - fid
        - fname
      title: ReactionLike
    ReactionRecast:
      type: object
      properties:
        fid:
          $ref: '#/components/schemas/Fid'
        fname:
          type: string
      required:
        - fid
        - fname
      title: ReactionRecast
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
    CastEmbedded:
      type: object
      properties:
        hash:
          type: string
        parent_hash:
          type: string
          nullable: true
        parent_url:
          type: string
          nullable: true
        root_parent_url:
          type: string
          nullable: true
        parent_author:
          type: object
          properties:
            fid:
              nullable: true
              allOf:
                - $ref: '#/components/schemas/Fid'
          required:
            - fid
        author:
          $ref: '#/components/schemas/UserDehydrated'
        app:
          nullable: true
          allOf:
            - $ref: '#/components/schemas/UserDehydrated'
        text:
          type: string
        timestamp:
          $ref: '#/components/schemas/Timestamp'
        embeds:
          type: array
          items:
            $ref: '#/components/schemas/EmbedDeep'
        channel:
          nullable: true
          allOf:
            - $ref: '#/components/schemas/ChannelDehydrated'
      required:
        - hash
        - parent_hash
        - parent_url
        - root_parent_url
        - parent_author
        - author
        - text
        - timestamp
        - embeds
        - channel
      title: CastEmbedded
    EmbedUrlMetadata:
      type: object
      properties:
        _status:
          type: string
        content_type:
          type: string
          nullable: true
        content_length:
          type: integer
          nullable: true
        image:
          type: object
          properties:
            height_px:
              type: integer
            width_px:
              type: integer
        video:
          type: object
          properties:
            duration_s:
              type: number
            stream:
              type: array
              items:
                type: object
                properties:
                  codec_name:
                    type: string
                  height_px:
                    type: integer
                  width_px:
                    type: integer
        html:
          $ref: '#/components/schemas/HtmlMetadata'
        frame:
          $ref: '#/components/schemas/Frame'
      required:
        - _status
      title: EmbedUrlMetadata
    EmbedDeep:
      oneOf:
        - $ref: '#/components/schemas/EmbedCastDeep'
        - $ref: '#/components/schemas/EmbedUrl'
      title: EmbedDeep
    HtmlMetadata:
      type: object
      properties:
        favicon:
          type: string
        modifiedTime:
          type: string
        ogArticleAuthor:
          type: string
        ogArticleExpirationTime:
          type: string
        ogArticleModifiedTime:
          type: string
        ogArticlePublishedTime:
          type: string
        ogArticlePublisher:
          type: string
        ogArticleSection:
          type: string
        ogArticleTag:
          type: string
        ogAudio:
          type: string
        ogAudioSecureURL:
          type: string
        ogAudioType:
          type: string
        ogAudioURL:
          type: string
        ogAvailability:
          type: string
        ogDate:
          type: string
        ogDescription:
          type: string
        ogDeterminer:
          type: string
        ogEpisode:
          type: string
        ogImage:
          type: array
          items:
            $ref: '#/components/schemas/ImageObject'
        ogLocale:
          type: string
        ogLocaleAlternate:
          type: string
        ogLogo:
          type: string
        ogMovie:
          type: string
        ogPriceAmount:
          type: string
        ogPriceCurrency:
          type: string
        ogProductAvailability:
          type: string
        ogProductCondition:
          type: string
        ogProductPriceAmount:
          type: string
        ogProductPriceCurrency:
          type: string
        ogProductRetailerItemId:
          type: string
        ogSiteName:
          type: string
        ogTitle:
          type: string
        ogType:
          type: string
        ogUrl:
          type: string
        ogVideo:
          type: array
          items:
            $ref: '#/components/schemas/VideoObject'
        ogVideoActor:
          type: string
        ogVideoActorId:
          type: string
        ogVideoActorRole:
          type: string
        ogVideoDirector:
          type: string
        ogVideoDuration:
          type: string
        ogVideoOther:
          type: string
        ogVideoReleaseDate:
          type: string
        ogVideoSecureURL:
          type: string
        ogVideoSeries:
          type: string
        ogVideoTag:
          type: string
        ogVideoTvShow:
          type: string
        ogVideoWriter:
          type: string
        ogWebsite:
          type: string
        updatedTime:
          type: string
        oembed:
          discriminator:
            propertyName: type
            mapping:
              link: '#/components/schemas/OembedLinkData'
              photo: '#/components/schemas/OembedPhotoData'
              rich: '#/components/schemas/OembedRichData'
              video: '#/components/schemas/OembedVideoData'
          oneOf:
            - $ref: '#/components/schemas/OembedRichData'
            - $ref: '#/components/schemas/OembedVideoData'
            - $ref: '#/components/schemas/OembedPhotoData'
            - $ref: '#/components/schemas/OembedLinkData'
      title: HtmlMetadata
    Frame:
      oneOf:
        - $ref: '#/components/schemas/FrameV1'
        - $ref: '#/components/schemas/FrameV2'
      title: Frame
      discriminator:
        propertyName: version
        mapping:
          '1': '#/components/schemas/FrameV2'
          0.0.0: '#/components/schemas/FrameV2'
          0.0.1: '#/components/schemas/FrameV2'
          next: '#/components/schemas/FrameV2'
          vNext: '#/components/schemas/FrameV1'
    EmbedCastDeep:
      type: object
      properties:
        cast_id:
          type: object
          properties:
            fid:
              $ref: '#/components/schemas/Fid'
            hash:
              type: string
          required:
            - fid
            - hash
          description: '[DEPRECATED: Use "cast" key instead]'
          deprecated: true
        cast:
          $ref: '#/components/schemas/CastDehydrated'
      required:
        - cast
      title: EmbedCastDeep
    ImageObject:
      type: object
      properties:
        height:
          type: string
        type:
          type: string
        url:
          type: string
        width:
          type: string
        alt:
          type: string
      required:
        - url
      title: ImageObject
    VideoObject:
      type: object
      properties:
        height:
          type: string
        type:
          type: string
        url:
          type: string
        width:
          type: string
      required:
        - url
      title: VideoObject
    OembedRichData:
      type: object
      properties:
        type:
          type: string
          enum:
            - rich
        version:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
          description: A text title, describing the resource.
        author_name:
          type: string
          nullable: true
          description: The name of the author/owner of the resource.
        author_url:
          type: string
          nullable: true
          description: A URL for the author/owner of the resource.
        provider_name:
          type: string
          nullable: true
          description: The name of the resource provider.
        provider_url:
          type: string
          nullable: true
          description: The url of the resource provider.
        cache_age:
          type: string
          nullable: true
          description: >-
            The suggested cache lifetime for this resource, in seconds.
            Consumers may choose to use this value or not.
        thumbnail_url:
          type: string
          nullable: true
          description: >-
            A URL to a thumbnail image representing the resource. The thumbnail
            must respect any maxwidth and maxheight parameters. If this
            parameter is present, thumbnail_width and thumbnail_height must also
            be present.
        thumbnail_width:
          type: number
          nullable: true
          description: >-
            The width of the optional thumbnail. If this parameter is present,
            thumbnail_url and thumbnail_height must also be present.
        thumbnail_height:
          type: number
          nullable: true
          description: >-
            The height of the optional thumbnail. If this parameter is present,
            thumbnail_url and thumbnail_width must also be present.
        html:
          type: string
          nullable: true
          description: >-
            The HTML required to display the resource. The HTML should have no
            padding or margins. Consumers may wish to load the HTML in an
            off-domain iframe to avoid XSS vulnerabilities. The markup should be
            valid XHTML 1.0 Basic.
        width:
          type: number
          nullable: true
          description: The width in pixels required to display the HTML.
        height:
          type: number
          nullable: true
          description: The height in pixels required to display the HTML.
      required:
        - type
        - version
        - html
        - width
        - height
      description: Rich OEmbed data
      title: OembedRichData
    OembedVideoData:
      type: object
      properties:
        type:
          type: string
          enum:
            - video
        version:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
          description: A text title, describing the resource.
        author_name:
          type: string
          nullable: true
          description: The name of the author/owner of the resource.
        author_url:
          type: string
          nullable: true
          description: A URL for the author/owner of the resource.
        provider_name:
          type: string
          nullable: true
          description: The name of the resource provider.
        provider_url:
          type: string
          nullable: true
          description: The url of the resource provider.
        cache_age:
          type: string
          nullable: true
          description: >-
            The suggested cache lifetime for this resource, in seconds.
            Consumers may choose to use this value or not.
        thumbnail_url:
          type: string
          nullable: true
          description: >-
            A URL to a thumbnail image representing the resource. The thumbnail
            must respect any maxwidth and maxheight parameters. If this
            parameter is present, thumbnail_width and thumbnail_height must also
            be present.
        thumbnail_width:
          type: number
          nullable: true
          description: >-
            The width of the optional thumbnail. If this parameter is present,
            thumbnail_url and thumbnail_height must also be present.
        thumbnail_height:
          type: number
          nullable: true
          description: >-
            The height of the optional thumbnail. If this parameter is present,
            thumbnail_url and thumbnail_width must also be present.
        html:
          type: string
          nullable: true
          description: >-
            The HTML required to embed a video player. The HTML should have no
            padding or margins. Consumers may wish to load the HTML in an
            off-domain iframe to avoid XSS vulnerabilities.
        width:
          type: number
          nullable: true
          description: The width in pixels required to display the HTML.
        height:
          type: number
          nullable: true
          description: The height in pixels required to display the HTML.
      required:
        - type
        - version
        - html
        - width
        - height
      description: Video OEmbed data
      title: OembedVideoData
    OembedPhotoData:
      type: object
      properties:
        type:
          type: string
          enum:
            - photo
        version:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
          description: A text title, describing the resource.
        author_name:
          type: string
          nullable: true
          description: The name of the author/owner of the resource.
        author_url:
          type: string
          nullable: true
          description: A URL for the author/owner of the resource.
        provider_name:
          type: string
          nullable: true
          description: The name of the resource provider.
        provider_url:
          type: string
          nullable: true
          description: The url of the resource provider.
        cache_age:
          type: string
          nullable: true
          description: >-
            The suggested cache lifetime for this resource, in seconds.
            Consumers may choose to use this value or not.
        thumbnail_url:
          type: string
          nullable: true
          description: >-
            A URL to a thumbnail image representing the resource. The thumbnail
            must respect any maxwidth and maxheight parameters. If this
            parameter is present, thumbnail_width and thumbnail_height must also
            be present.
        thumbnail_width:
          type: number
          nullable: true
          description: >-
            The width of the optional thumbnail. If this parameter is present,
            thumbnail_url and thumbnail_height must also be present.
        thumbnail_height:
          type: number
          nullable: true
          description: >-
            The height of the optional thumbnail. If this parameter is present,
            thumbnail_url and thumbnail_width must also be present.
        url:
          type: string
          nullable: true
          description: >-
            The source URL of the image. Consumers should be able to insert this
            URL into an <img> element. Only HTTP and HTTPS URLs are valid.
        width:
          type: number
          nullable: true
          description: The width in pixels of the image specified in the url parameter.
        height:
          type: number
          nullable: true
          description: The height in pixels of the image specified in the url parameter.
      required:
        - type
        - version
        - url
        - width
        - height
      description: Photo OEmbed data
      title: OembedPhotoData
    OembedLinkData:
      type: object
      properties:
        type:
          type: string
          enum:
            - link
        version:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
          description: A text title, describing the resource.
        author_name:
          type: string
          nullable: true
          description: The name of the author/owner of the resource.
        author_url:
          type: string
          nullable: true
          description: A URL for the author/owner of the resource.
        provider_name:
          type: string
          nullable: true
          description: The name of the resource provider.
        provider_url:
          type: string
          nullable: true
          description: The url of the resource provider.
        cache_age:
          type: string
          nullable: true
          description: >-
            The suggested cache lifetime for this resource, in seconds.
            Consumers may choose to use this value or not.
        thumbnail_url:
          type: string
          nullable: true
          description: >-
            A URL to a thumbnail image representing the resource. The thumbnail
            must respect any maxwidth and maxheight parameters. If this
            parameter is present, thumbnail_width and thumbnail_height must also
            be present.
        thumbnail_width:
          type: number
          nullable: true
          description: >-
            The width of the optional thumbnail. If this parameter is present,
            thumbnail_url and thumbnail_height must also be present.
        thumbnail_height:
          type: number
          nullable: true
          description: >-
            The height of the optional thumbnail. If this parameter is present,
            thumbnail_url and thumbnail_width must also be present.
      required:
        - type
        - version
      description: Link OEmbed data
      title: OembedLinkData
    FrameV1:
      type: object
      properties:
        version:
          type: string
          description: Version of the mini app, 'next' for v2, 'vNext' for v1
        image:
          type: string
          description: URL of the image
        frames_url:
          type: string
          description: Launch URL of the mini app
        buttons:
          type: array
          items:
            $ref: '#/components/schemas/FrameActionButton'
        post_url:
          type: string
          description: Post URL to take an action on this mini app
        title:
          type: string
        image_aspect_ratio:
          type: string
        input:
          type: object
          properties:
            text:
              type: string
              description: Input text for the mini app
        state:
          type: object
          properties:
            serialized:
              type: string
              description: State for the mini app in a serialized format
      required:
        - version
        - image
        - frames_url
      description: Mini app v1 object
      title: FrameV1
    FrameV2:
      type: object
      properties:
        version:
          type: string
          description: Version of the mini app, 'next' for v2, 'vNext' for v1
        image:
          type: string
          description: URL of the image
        frames_url:
          type: string
          description: Launch URL of the mini app
        title:
          type: string
          description: Button title of a mini app
        manifest:
          $ref: '#/components/schemas/FarcasterManifest'
        author:
          $ref: '#/components/schemas/UserDehydrated'
        metadata:
          type: object
          properties:
            html:
              $ref: '#/components/schemas/HtmlMetadata'
          required:
            - html
      required:
        - version
        - image
        - frames_url
      title: FrameV2
      description: Mini app v2 object
    FrameActionButton:
      type: object
      properties:
        title:
          type: string
          description: Title of the button
        index:
          type: integer
          description: Index of the button
        action_type:
          $ref: '#/components/schemas/FrameButtonActionType'
        target:
          type: string
          description: Target of the button
        post_url:
          type: string
          description: >-
            Used specifically for the tx action type to post a successful
            transaction hash
      required:
        - index
        - action_type
      title: FrameActionButton
    FarcasterManifest:
      type: object
      properties:
        account_association:
          $ref: '#/components/schemas/EncodedJsonFarcasterSignature'
        frame:
          type: object
          properties:
            version:
              type: string
              enum:
                - 0.0.0
                - 0.0.1
                - '1'
                - next
            name:
              type: string
            home_url:
              type: string
            icon_url:
              type: string
            image_url:
              type: string
            button_title:
              type: string
            splash_image_url:
              type: string
            splash_background_color:
              type: string
            webhook_url:
              type: string
            subtitle:
              type: string
              description: Short subtitle for the configuration
            description:
              type: string
              description: Detailed description of the configuration
            screenshot_urls:
              type: array
              items:
                type: string
                format: uri
              description: URLs of screenshots showcasing the configuration
            primary_category:
              type: string
              description: Primary category the configuration belongs to
            tags:
              type: array
              items:
                type: string
              description: Tags associated with the configuration
            hero_image_url:
              type: string
              format: uri
              description: URL of the hero image displayed for the configuration
            tagline:
              type: string
              description: Short tagline for the configuration
            og_title:
              type: string
              description: Title used for Open Graph previews
            og_description:
              type: string
              description: Description used for Open Graph previews
            og_image_url:
              type: string
              format: uri
              description: Image URL used for Open Graph previews
            noindex:
              type: boolean
              description: Whether search engines should not index this configuration
          required:
            - version
            - name
            - home_url
            - icon_url
        miniapp:
          type: object
          properties:
            version:
              type: string
              enum:
                - 0.0.0
                - 0.0.1
                - '1'
                - next
            name:
              type: string
            home_url:
              type: string
            icon_url:
              type: string
            image_url:
              type: string
            button_title:
              type: string
            splash_image_url:
              type: string
            splash_background_color:
              type: string
            webhook_url:
              type: string
            subtitle:
              type: string
              description: Short subtitle for the configuration
            description:
              type: string
              description: Detailed description of the configuration
            screenshot_urls:
              type: array
              items:
                type: string
                format: uri
              description: URLs of screenshots showcasing the configuration
            primary_category:
              type: string
              description: Primary category the configuration belongs to
            tags:
              type: array
              items:
                type: string
              description: Tags associated with the configuration
            hero_image_url:
              type: string
              format: uri
              description: URL of the hero image displayed for the configuration
            tagline:
              type: string
              description: Short tagline for the configuration
            og_title:
              type: string
              description: Title used for Open Graph previews
            og_description:
              type: string
              description: Description used for Open Graph previews
            og_image_url:
              type: string
              format: uri
              description: Image URL used for Open Graph previews
            noindex:
              type: boolean
              description: Whether search engines should not index this configuration
          required:
            - version
            - name
            - home_url
            - icon_url
      required:
        - account_association
      title: FarcasterManifest
    FrameButtonActionType:
      type: string
      enum:
        - post
        - post_redirect
        - tx
        - link
        - mint
      description: >-
        The action type of a mini app button. Action types "mint" & "link" are
        to be handled on the client side only and so they will produce a no/op
        for POST /farcaster/frame/action.
      title: FrameButtonActionType
    EncodedJsonFarcasterSignature:
      type: object
      properties:
        header:
          type: string
        payload:
          type: string
        signature:
          type: string
      required:
        - header
        - payload
        - signature
      title: EncodedJsonFarcasterSignature
      description: Encoded JSON Farcaster signature
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