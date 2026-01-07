# Create x402 signature

> Create a signature for a given x402 resource using the specified wallet.

## Create x402 Signature

## Node.js SDK

🔗 **SDK Method:** [createX402Signature](/nodejs-sdk/onchain-apis/createX402Signature)

Use this API endpoint with the Neynar Node.js SDK for typed responses and better developer experience.


## OpenAPI

````yaml post /v2/signature/x402/
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
  /v2/signature/x402/:
    post:
      tags:
        - Onchain
      summary: Create x402 signature
      description: Create a signature for a given x402 resource using the specified wallet.
      operationId: create-x402-signature
      parameters:
        - $ref: '#/components/parameters/WalletIdHeader'
        - name: x-api-key
          in: header
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                payment_requirements:
                  type: object
                  properties:
                    x402Version:
                      type: number
                      enum:
                        - 1
                    accepts:
                      type: array
                      items:
                        type: object
                        properties:
                          scheme:
                            type: string
                            enum:
                              - exact
                          network:
                            type: string
                            enum:
                              - base
                              - base-sepolia
                          maxAmountRequired:
                            type: string
                          asset:
                            type: string
                            pattern: ^0x[a-fA-F0-9]{40}$
                            example: '0x5a927ac639636e534b678e81768ca19e2c6280b7'
                            description: Ethereum address
                            title: EthAddress
                          payTo:
                            type: string
                            pattern: ^0x[a-fA-F0-9]{40}$
                            example: '0x5a927ac639636e534b678e81768ca19e2c6280b7'
                            description: Ethereum address
                            title: EthAddress
                          resource:
                            type: string
                            format: uri
                          description:
                            type: string
                          mimeType:
                            type: string
                          outputSchema:
                            type: object
                            additionalProperties:
                              nullable: true
                            nullable: true
                          maxTimeoutSeconds:
                            type: number
                          extra:
                            type: object
                            additionalProperties:
                              nullable: true
                            nullable: true
                        required:
                          - scheme
                          - network
                          - maxAmountRequired
                          - asset
                          - payTo
                          - resource
                          - description
                          - maxTimeoutSeconds
                      minItems: 1
                  required:
                    - x402Version
                    - accepts
              required:
                - payment_requirements
        required: true
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  x402Version:
                    type: number
                    enum:
                      - 1
                  scheme:
                    type: string
                    enum:
                      - exact
                  network:
                    type: string
                    enum:
                      - base
                      - base-sepolia
                  payload:
                    type: object
                    properties:
                      signature:
                        type: string
                        pattern: ^0x[a-fA-F0-9]{130}$
                      authorization:
                        type: object
                        properties:
                          from:
                            $ref: '#/components/schemas/EthAddress'
                          to:
                            $ref: '#/components/schemas/EthAddress'
                          value:
                            type: string
                          validAfter:
                            type: string
                          validBefore:
                            type: string
                          nonce:
                            type: string
                            pattern: ^0x[a-fA-F0-9]{64}$
                        required:
                          - from
                          - to
                          - value
                          - validAfter
                          - validBefore
                          - nonce
                    required:
                      - signature
                      - authorization
                required:
                  - x402Version
                  - scheme
                  - network
                  - payload
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorRes'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorRes'
        '403':
          description: Forbidden
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorRes'
        '500':
          description: Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorRes'
      externalDocs:
        url: https://docs.neynar.com/reference/create-x402-signature
components:
  parameters:
    WalletIdHeader:
      name: x-wallet-id
      description: Wallet ID to use for transactions
      in: header
      required: true
      schema:
        type: string
      x-is-global-header: true
  schemas:
    EthAddress:
      type: string
      pattern: ^0x[a-fA-F0-9]{40}$
      example: '0x5a927ac639636e534b678e81768ca19e2c6280b7'
      description: Ethereum address
      title: EthAddress
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