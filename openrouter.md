---
title: Quickstart
subtitle: Get started with OpenRouter
slug: quickstart
headline: OpenRouter Quickstart Guide | Developer Documentation
canonical-url: 'https://openrouter.ai/docs/quickstart'
'og:site_name': OpenRouter Documentation
'og:title': OpenRouter Quickstart Guide
'og:description': >-
  Get started with OpenRouter's unified API for hundreds of AI models. Learn how
  to integrate using OpenAI SDK, direct API calls, or third-party frameworks.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?pathname=quickstart&title=Quick%20Start&description=Start%20using%20OpenRouter%20API%20in%20minutes%20with%20any%20SDK
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

OpenRouter provides a unified API that gives you access to hundreds of AI models through a single endpoint, while automatically handling fallbacks and selecting the most cost-effective options. Get started with just a few lines of code using your preferred SDK or framework.

<Tip>
  Looking for information about free models and rate limits? Please see the [FAQ](/docs/faq#how-are-rate-limits-calculated)
</Tip>

In the examples below, the OpenRouter-specific headers are optional. Setting them allows your app to appear on the OpenRouter leaderboards. For detailed information about app attribution, see our [App Attribution guide](/docs/features/app-attribution).

## Using the OpenAI SDK

<CodeGroup>

```python title="Python"
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="<OPENROUTER_API_KEY>",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  model="openai/gpt-4o",
  messages=[
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
)

print(completion.choices[0].message.content)
```

```typescript title="TypeScript"
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '<OPENROUTER_API_KEY>',
  defaultHeaders: {
    'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
  },
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'user',
        content: 'What is the meaning of life?',
      },
    ],
  });

  console.log(completion.choices[0].message);
}

main();
```

</CodeGroup>

## Using the OpenRouter API directly

<Tip>
  You can use the interactive [Request Builder](/request-builder) to generate OpenRouter API requests in the language of your choice.
</Tip>

<CodeGroup>

```python title="Python"
import requests
import json

response = requests.post(
  url="https://openrouter.ai/api/v1/chat/completions",
  headers={
    "Authorization": "Bearer <OPENROUTER_API_KEY>",
    "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  data=json.dumps({
    "model": "openai/gpt-4o", # Optional
    "messages": [
      {
        "role": "user",
        "content": "What is the meaning of life?"
      }
    ]
  })
)
```

```typescript title="TypeScript"
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <OPENROUTER_API_KEY>',
    'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'user',
        content: 'What is the meaning of life?',
      },
    ],
  }),
});
```

```shell title="Shell"
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
}'
```

</CodeGroup>

The API also supports [streaming](/docs/api-reference/streaming).

## Using third-party SDKs

For information about using third-party SDKs and frameworks with OpenRouter, please [see our frameworks documentation.](/docs/community/frameworks-overview)

---
title: Models
subtitle: One API for hundreds of models
headline: OpenRouter Models | Access 400+ AI Models Through One API
canonical-url: 'https://openrouter.ai/docs/models'
'og:site_name': OpenRouter Documentation
'og:title': OpenRouter Models - Unified Access to 400+ AI Models
'og:description': >-
  Access all major language models (LLMs) through OpenRouter's unified API.
  Browse available models, compare capabilities, and integrate with your
  preferred provider.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?pathname=models&title=AI%20Model%20Hub&description=Access%20all%20LLMs%20through%20one%20unified%20API%20endpoint
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

Explore and browse 400+ models and providers [on our website](/models), or [with our API](/docs/api-reference/list-available-models) (including RSS).

## Models API Standard

Our [Models API](/docs/api-reference/list-available-models) makes the most important information about all LLMs freely available as soon as we confirm it.

### API Response Schema

The Models API returns a standardized JSON response format that provides comprehensive metadata for each available model. This schema is cached at the edge and designed for reliable integration for production applications.

#### Root Response Object

```json
{
  "data": [
    /* Array of Model objects */
  ]
}
```

#### Model Object Schema

Each model in the `data` array contains the following standardized fields:

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique model identifier used in API requests (e.g., `"google/gemini-2.5-pro-preview"`) |
| `canonical_slug` | `string` | Permanent slug for the model that never changes |
| `name` | `string` | Human-readable display name for the model |
| `created` | `number` | Unix timestamp of when the model was added to OpenRouter |
| `description` | `string` | Detailed description of the model's capabilities and characteristics |
| `context_length` | `number` | Maximum context window size in tokens |
| `architecture` | `Architecture` | Object describing the model's technical capabilities |
| `pricing` | `Pricing` | Lowest price structure for using this model |
| `top_provider` | `TopProvider` | Configuration details for the primary provider |
| `per_request_limits` | Rate limiting information (null if no limits) |
| `supported_parameters` | `string[]` | Array of supported API parameters for this model |

#### Architecture Object

```typescript
{
  "input_modalities": string[], // Supported input types: ["file", "image", "text"]
  "output_modalities": string[], // Supported output types: ["text"]
  "tokenizer": string,          // Tokenization method used
  "instruct_type": string | null // Instruction format type (null if not applicable)
}
```

#### Pricing Object

All pricing values are in USD per token/request/unit. A value of `"0"` indicates the feature is free.

```typescript
{
  "prompt": string,           // Cost per input token
  "completion": string,       // Cost per output token
  "request": string,          // Fixed cost per API request
  "image": string,           // Cost per image input
  "web_search": string,      // Cost per web search operation
  "internal_reasoning": string, // Cost for internal reasoning tokens
  "input_cache_read": string,   // Cost per cached input token read
  "input_cache_write": string   // Cost per cached input token write
}
```

#### Top Provider Object

```typescript
{
  "context_length": number,        // Provider-specific context limit
  "max_completion_tokens": number, // Maximum tokens in response
  "is_moderated": boolean         // Whether content moderation is applied
}
```

#### Supported Parameters

The `supported_parameters` array indicates which OpenAI-compatible parameters work with each model:

- `tools` - Function calling capabilities
- `tool_choice` - Tool selection control
- `max_tokens` - Response length limiting
- `temperature` - Randomness control
- `top_p` - Nucleus sampling
- `reasoning` - Internal reasoning mode
- `include_reasoning` - Include reasoning in response
- `structured_outputs` - JSON schema enforcement
- `response_format` - Output format specification
- `stop` - Custom stop sequences
- `frequency_penalty` - Repetition reduction
- `presence_penalty` - Topic diversity
- `seed` - Deterministic outputs

<Note title='Different models tokenize text in different ways'>
  Some models break up text into chunks of multiple characters (GPT, Claude,
  Llama, etc), while others tokenize by character (PaLM). This means that token
  counts (and therefore costs) will vary between models, even when inputs and
  outputs are the same. Costs are displayed and billed according to the
  tokenizer for the model in use. You can use the `usage` field in the response
  to get the token counts for the input and output.
</Note>

If there are models or providers you are interested in that OpenRouter doesn't have, please tell us about them in our [Discord channel](https://openrouter.ai/discord).

## For Providers

If you're interested in working with OpenRouter, you can learn more on our [providers page](/docs/use-cases/for-providers).

---
title: Principles
subtitle: Core principles and values of OpenRouter
headline: Principles | OpenRouter's Core Values and Mission
canonical-url: 'https://openrouter.ai/docs/principles'
'og:site_name': OpenRouter Documentation
'og:title': Principles - OpenRouter's Core Values
'og:description': >-
  Learn about OpenRouter's guiding principles and mission. Understand our
  commitment to price optimization, standardized APIs, and high availability in
  AI model deployment.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?pathname=principles&title=Core%20Values&description=Multi-model%20AI%20access%20with%20optimized%20pricing%20and%20reliability
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

OpenRouter helps developers source and optimize AI usage. We believe the future is multi-model and multi-provider.

## Why OpenRouter?

**Price and Performance**. OpenRouter scouts for the best prices, the lowest latencies, and the highest throughput across dozens of providers, and lets you choose how to [prioritize](/docs/features/provider-routing) them.

**Standardized API**. No need to change code when switching between models or providers. You can even let your users [choose and pay for their own](/docs/use-cases/oauth-pkce).

**Real-World Insights**. Be the first to take advantage of new models. See real-world data of [how often models are used](https://openrouter.ai/rankings) for different purposes. Keep up to date in our [Discord channel](https://discord.com/channels/1091220969173028894/1094454198688546826).

**Consolidated Billing**. Simple and transparent billing, regardless of how many providers you use.

**Higher Availability**. Fallback providers, and automatic, smart routing means your requests still work even when providers go down.

**Higher Rate Limits**. OpenRouter works directly with providers to provide better rate limits and more throughput.

---
title: Frequently Asked Questions
subtitle: Common questions about OpenRouter
slug: faq
headline: OpenRouter FAQ | Developer Documentation
canonical-url: 'https://openrouter.ai/docs/faq'
'og:site_name': OpenRouter Documentation
'og:title': OpenRouter FAQ
'og:description': >-
  Find answers to commonly asked questions about OpenRouter's unified API, model
  access, pricing, and integration.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?pathname=faq&title=FAQ&description=Common%20questions%20about%20OpenRouter
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

import {
  bn,
  FREE_MODEL_CREDITS_THRESHOLD,
  FREE_MODEL_HAS_CREDITS_RPD,
  FREE_MODEL_NO_CREDITS_RPD,
  getTotalFeeString,
  openRouterBYOKFee,
} from '../../imports/constants';

## Getting started

<AccordionGroup>
  <Accordion title='Why should I use OpenRouter?'>
    OpenRouter provides a unified API to access all the major LLM models on the
    market. It also allows users to aggregate their billing in one place and
    keep track of all of their usage using our analytics.

    OpenRouter passes through the pricing of the underlying providers, while pooling their uptime,
    so you get the same pricing you'd get from the provider directly, with a
    unified API and fallbacks so that you get much better uptime.

  </Accordion>
  <Accordion title='How do I get started with OpenRouter?'>
    To get started, create an account and add credits on the
    [Credits](https://openrouter.ai/settings/credits) page. Credits are simply
    deposits on OpenRouter that you use for LLM inference.
    When you use the API or chat interface, we deduct the request cost from your
    credits. Each model and provider has a different price per million tokens.

    Once you have credits you can either use the chat room, or create API keys
    and start using the API. You can read our [quickstart](/docs/quickstart)
    guide for code samples and more.

  </Accordion>
  <Accordion title='How do I get support?'>
    The best way to get support is to join our
    [Discord](https://discord.gg/fVyRaUDgxW) and ping us in the #help forum.
  </Accordion>
  <Accordion title='How do I get billed for my usage on OpenRouter?'>
    For each model we have the pricing displayed per million tokens. There is
    usually a different price for prompt and completion tokens. There are also
    models that charge per request, for images and for reasoning tokens. All of
    these details will be visible on the models page.

    When you make a request to OpenRouter, we receive the total number of tokens processed
    by the provider. We then calculate the corresponding cost and deduct it from your credits.
    You can review your complete usage history in the [Activity tab](https://openrouter.ai/activity).

    You can also add the `usage: {include: true}` parameter to your chat request
    to get the usage information in the response.

    We pass through the pricing of the underlying providers; there is no markup
    on inference pricing (however we do charge a [fee](/docs/faq#pricing-and-fees) when purchasing credits).

  </Accordion>

</AccordionGroup>

## Pricing and Fees

<AccordionGroup>
  <Accordion title='What are the fees for using OpenRouter?'>
    OpenRouter charges a {getTotalFeeString('stripe')} fee when you purchase credits. We pass through
    the pricing of the underlying model providers without any markup, so you pay
    the same rate as you would directly with the provider.

    Crypto payments are charged a fee of {getTotalFeeString('coinbase')}.

  </Accordion>
  <Accordion title='Is there a fee for using my own provider keys (BYOK)?'>
    Yes, if you choose to use your own provider API keys (Bring Your Own Key -
    BYOK), there is a fee of{' '}
    {bn(openRouterBYOKFee.fraction).times(100).toString()}% of what the same
    model and provider would normally cost on OpenRouter. This fee is deducted
    from your OpenRouter credits. This allows you to manage your rate limits and
    costs directly with the provider while still leveraging OpenRouter's unified
    interface.
  </Accordion>
</AccordionGroup>

## Models and Providers

<AccordionGroup>
  <Accordion title="What LLM models does OpenRouter support?">
    OpenRouter provides access to a wide variety of LLM models, including frontier models from major AI labs.
    For a complete list of models you can visit the [models browser](https://openrouter.ai/models) or fetch the list through the [models api](https://openrouter.ai/api/v1/models).
  </Accordion>
  <Accordion title='How frequently are new models added?'>
    We work on adding models as quickly as we can. We often have partnerships with
    the labs releasing models and can release models as soon as they are
    available. If there is a model missing that you'd like OpenRouter to support, feel free to message us on
    [Discord](https://discord.gg/fVyRaUDgxW).
  </Accordion>
  <Accordion title='What are model variants?'>
    Variants are suffixes that can be added to the model slug to change its behavior.

    Static variants can only be used with specific models and these are listed in our [models api](https://openrouter.ai/api/v1/models).

    1. `:free` - The model is always provided for free and has low rate limits.
    2. `:beta` - The model is not moderated by OpenRouter.
    3. `:extended` - The model has longer than usual context length.
    4. `:thinking` - The model supports reasoning by default.

    Dynamic variants can be used on all models and they change the behavior of how the request is routed or used.

    1. `:online` - All requests will run a query to extract web results that are attached to the prompt.
    2. `:nitro` - Providers will be sorted by throughput rather than the default sort, optimizing for faster response times.
    3. `:floor` - Providers will be sorted by price rather than the default sort, prioritizing the most cost-effective options.

  </Accordion>
  <Accordion title='I am an inference provider, how can I get listed on OpenRouter?'>
    You can read our requirements at the [Providers
    page](/docs/use-cases/for-providers). If you would like to contact us, the best
    place to reach us is over email.
  </Accordion>
  <Accordion title='What is the expected latency/response time for different models?'>
    For each model on OpenRouter we show the latency (time to first token) and the token
    throughput for all providers. You can use this to estimate how long requests
    will take. If you would like to optimize for throughput you can use the
    `:nitro` variant to route to the fastest provider.
  </Accordion>
  <Accordion title='How does model fallback work if a provider is unavailable?'>
    If a provider returns an error OpenRouter will automatically fall back to the
    next provider. This happens transparently to the user and allows production
    apps to be much more resilient. OpenRouter has a lot of options to configure
    the provider routing behavior. The full documentation can be found [here](/docs/features/provider-routing).
  </Accordion>
</AccordionGroup>

## API Technical Specifications

<AccordionGroup>
  <Accordion title='What authentication methods are supported?'>
    OpenRouter uses three authentication methods:

    1. Cookie-based authentication for the web interface and chatroom
    2. API keys (passed as Bearer tokens) for accessing the completions API and other core endpoints
    3. [Provisioning API keys](/docs/features/provisioning-api-keys) for programmatically managing API keys through the key management endpoints

  </Accordion>
  <Accordion title='How are rate limits calculated?'>
    For free models, rate limits are determined by the credits that you have purchased.
    If you have purchased at least {FREE_MODEL_CREDITS_THRESHOLD} credits, your free model rate limit will be {FREE_MODEL_HAS_CREDITS_RPD} requests per day.
    Otherwise, you will be rate limited to {FREE_MODEL_NO_CREDITS_RPD} free model API requests per day.

    You can learn more about how rate limits work for paid accounts in our [rate limits documentation](/docs/api-reference/limits).

  </Accordion>
  <Accordion title='What API endpoints are available?'>
    OpenRouter implements the OpenAI API specification for /completions and
    /chat/completions endpoints, allowing you to use any model with the same
    request/response format. Additional endpoints like /api/v1/models are also
    available. See our [API documentation](/docs/api-reference/overview) for
    detailed specifications.
  </Accordion>
  <Accordion title='What are the supported formats?'>
    The API supports text and images.
    [Images](/docs/api-reference/overview#images--multimodal) can be passed as
    URLs or base64 encoded images. PDF and other file types are coming soon.
  </Accordion>
  <Accordion title='How does streaming work?'>
    Streaming uses server-sent events (SSE) for real-time token delivery. Set
    `stream: true` in your request to enable streaming responses.
  </Accordion>
  <Accordion title='What SDK support is available?'>
    OpenRouter is a drop-in replacement for OpenAI. Therefore, any SDKs that
    support OpenAI by default also support OpenRouter. Check out our
    [docs](/docs/community/open-ai-sdk) for more details.
  </Accordion>
</AccordionGroup>

## Privacy and Data Logging

Please see our [Terms of Service](https://openrouter.ai/terms) and [Privacy Policy](https://openrouter.ai/privacy).

<AccordionGroup>
  <Accordion title='What data is logged during API use?'>
    We log basic request metadata (timestamps, model used, token counts). Prompt
    and completion are not logged by default. We do zero logging of your prompts/completions,
    even if an error occurs, unless you opt-in to logging them.

    We have an opt-in [setting](https://openrouter.ai/settings/privacy) that
    lets users opt-in to log their prompts and completions in exchange for a 1%
    discount on usage costs.

  </Accordion>
  <Accordion title='What data is logged during Chatroom use?'>
  The same data privacy applies to the chatroom as the API. All conversations
  in the chatroom are stored locally on your device. Conversations will not sync across devices.
  It is possible to export and import conversations using the settings menu in the chatroom.

  </Accordion>
  <Accordion title='What third-party sharing occurs?'>
    OpenRouter is a proxy that sends your requests to the model provider for it to be completed.
    We work with all providers to, when possible, ensure that prompts and completions are not logged or used for training.
    Providers that do log, or where we have been unable to confirm their policy, will not be routed to unless the model training
    toggle is switched on in the [privacy settings](https://openrouter.ai/settings/privacy) tab.

    If you specify [provider routing](/docs/features/provider-routing) in your request, but none of the providers
    match the level of privacy specified in your account settings, you will get an error and your request will not complete.

  </Accordion>
</AccordionGroup>

## Credit and Billing Systems

<AccordionGroup>
  <Accordion title='What purchase options exist?'>
    OpenRouter uses a credit system where the base currency is US dollars. All
    of the pricing on our site and API is denoted in dollars. Users can top up
    their balance manually or set up auto top up so that the balance is
    replenished when it gets below the set threshold.
  </Accordion>
  <Accordion title='Do credits expire?'>
    Per our [terms](https://openrouter.ai/terms), we reserve the right to expire
    unused credits after one year of purchase.
  </Accordion>
  <Accordion title="My credits haven't showed up in my account">
    If you paid using Stripe, sometimes there is an issue with the Stripe
    integration and credits can get delayed in showing up on your account. Please allow up to one hour.
    If your credits still have not appeared after an hour, contact us on [Discord](https://discord.gg/fVyRaUDgxW) and we will
    look into it.

    If you paid using crypto, please reach out to us on [Discord](https://discord.gg/fVyRaUDgxW)
    and we will look into it.

  </Accordion>
  <Accordion title="What's the refund policy?">
    Refunds for unused Credits may be requested within twenty-four (24) hours from the time the transaction was processed. If no refund request is received within twenty-four (24) hours following the purchase, any unused Credits become non-refundable. To request a refund within the eligible period, you must email OpenRouter at support@openrouter.ai. The unused credit amount will be refunded to your payment method; the platform fees are non-refundable. Note that cryptocurrency payments are never refundable.
  </Accordion>
  <Accordion title='How to monitor credit usage?'>
    The [Activity](https://openrouter.ai/activity) page allows users to view
    their historic usage and filter the usage by model, provider and api key.

    We also provide a [credits api](/docs/api-reference/get-credits) that has
    live information about the balance and remaining credits for the account.

  </Accordion>
  <Accordion title='What free tier options exist?'>
    All new users receive a very small free allowance to be able to test out OpenRouter.
    There are many [free models](https://openrouter.ai/models?max_price=0) available
    on OpenRouter, it is important to note that these models have low rate limits ({FREE_MODEL_NO_CREDITS_RPD} requests per day total)
    and are usually not suitable for production use. If you have purchased at least {FREE_MODEL_CREDITS_THRESHOLD} credits,
    the free models will be limited to {FREE_MODEL_HAS_CREDITS_RPD} requests per day.
  </Accordion>
  <Accordion title='How do volume discounts work?'>
    OpenRouter does not currently offer volume discounts, but you can reach out to us
    over email if you think you have an exceptional use case.
  </Accordion>
  <Accordion title='What payment methods are accepted?'>
    We accept all major credit cards, AliPay and cryptocurrency payments in
    USDC. We are working on integrating PayPal soon, if there are any payment
    methods that you would like us to support please reach out on [Discord](https://discord.gg/fVyRaUDgxW).
  </Accordion>
  <Accordion title='How does OpenRouter make money?'>
    We charge a small [fee](/docs/faq#pricing-and-fees) when purchasing credits. We never mark-up the pricing
    of the underlying providers, and you'll always pay the same as the provider's
    listed price.
  </Accordion>
</AccordionGroup>

## Account Management

<AccordionGroup>
  <Accordion title='How can I delete my account?'>
    Go to the [Settings](https://openrouter.ai/settings/preferences) page and click Manage Account.
    In the modal that opens, select the Security tab. You'll find an option there to delete your account.

    Note that unused credits will be lost and cannot be reclaimed if you delete and later recreate your account.

  </Accordion>
  <Accordion title='How does team access work?'>
    Team management is coming very soon! For now you can use [provisioning API
    keys](/docs/features/provisioning-api-keys) to allow sharing credits with
    people on your team.
  </Accordion>
  <Accordion title='What analytics are available?'>
    Our [activity dashboard](https://openrouter.ai/activity) provides real-time
    usage metrics. If you would like any specific reports or metrics please
    contact us.
  </Accordion>
  <Accordion title='How can I contact support?'>
    The best way to reach us is to join our
    [Discord](https://discord.gg/fVyRaUDgxW) and ping us in the #help forum.
  </Accordion>
</AccordionGroup>

---
title: Tool & Function Calling
subtitle: Use tools in your prompts
headline: Tool & Function Calling | Use Tools with OpenRouter
canonical-url: 'https://openrouter.ai/docs/features/tool-calling'
'og:site_name': OpenRouter Documentation
'og:title': Tool & Function Calling - Use Tools with OpenRouter
'og:description': >-
  Use tools (or functions) in your prompts with OpenRouter. Learn how to use
  tools with OpenAI, Anthropic, and other models that support tool calling.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?title=Tool%20&%20Function%20Calling&description=Use%20tools%20with%20OpenRouter
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

import { API_KEY_REF, Model } from '../../../imports/constants';

Tool calls (also known as function calls) give an LLM access to external tools. The LLM does not call the tools directly. Instead, it suggests the tool to call. The user then calls the tool separately and provides the results back to the LLM. Finally, the LLM formats the response into an answer to the user's original question.

OpenRouter standardizes the tool calling interface across models and providers, making it easy to integrate external tools with any supported model. 

**Supported Models**: You can find models that support tool calling by filtering on [openrouter.ai/models?supported_parameters=tools](https://openrouter.ai/models?supported_parameters=tools).

If you prefer to learn from a full end-to-end example, keep reading.

## Request Body Examples

Tool calling with OpenRouter involves three key steps. Here are the essential request body formats for each step:

### Step 1: Inference Request with Tools

```json
{
  "model": "google/gemini-2.0-flash-001",
  "messages": [
    {
      "role": "user", 
      "content": "What are the titles of some James Joyce books?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_gutenberg_books",
        "description": "Search for books in the Project Gutenberg library",
        "parameters": {
          "type": "object",
          "properties": {
            "search_terms": {
              "type": "array",
              "items": {"type": "string"},
              "description": "List of search terms to find books"
            }
          },
          "required": ["search_terms"]
        }
      }
    }
  ]
}
```

### Step 2: Tool Execution (Client-Side)

After receiving the model's response with `tool_calls`, execute the requested tool locally and prepare the result:

```javascript
// Model responds with tool_calls, you execute the tool locally
const toolResult = await searchGutenbergBooks(["James", "Joyce"]);
```

### Step 3: Inference Request with Tool Results

```json
{
  "model": "google/gemini-2.0-flash-001", 
  "messages": [
    {
      "role": "user",
      "content": "What are the titles of some James Joyce books?"
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_abc123",
          "type": "function", 
          "function": {
            "name": "search_gutenberg_books",
            "arguments": "{\"search_terms\": [\"James\", \"Joyce\"]}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_abc123",
      "name": "search_gutenberg_books",
      "content": "[{\"id\": 4300, \"title\": \"Ulysses\", \"authors\": [{\"name\": \"Joyce, James\"}]}]"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_gutenberg_books",
        "description": "Search for books in the Project Gutenberg library",
        "parameters": {
          "type": "object",
          "properties": {
            "search_terms": {
              "type": "array",
              "items": {"type": "string"},
              "description": "List of search terms to find books"
            }
          },
          "required": ["search_terms"]
        }
      }
    }
  ]
}
```

**Note**: The `tools` parameter must be included in every request (Steps 1 and 3) so the router can validate the tool schema on each call.

### Tool Calling Example

Here is Python code that gives LLMs the ability to call an external API -- in this case Project Gutenberg, to search for books.

First, let's do some basic setup:

<Template data={{
  API_KEY_REF,
  MODEL: 'google/gemini-2.0-flash-001'
}}>
<CodeGroup>

```python
import json, requests
from openai import OpenAI

OPENROUTER_API_KEY = f"{{API_KEY_REF}}"

# You can use any model that supports tool calling
MODEL = "{{MODEL}}"

openai_client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=OPENROUTER_API_KEY,
)

task = "What are the titles of some James Joyce books?"

messages = [
  {
    "role": "system",
    "content": "You are a helpful assistant."
  },
  {
    "role": "user",
    "content": task,
  }
]

```

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer {{API_KEY_REF}}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: '{{MODEL}}',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      {
        role: 'user',
        content: 'What are the titles of some James Joyce books?',
      },
    ],
  }),
});
```

</CodeGroup>
</Template>

### Define the Tool

Next, we define the tool that we want to call. Remember, the tool is going to get _requested_ by the LLM, but the code we are writing here is ultimately responsible for executing the call and returning the results to the LLM.

<Template data={{
  API_KEY_REF,
  MODEL: 'google/gemini-2.0-flash-001'
}}>
<CodeGroup>

```python
def search_gutenberg_books(search_terms):
    search_query = " ".join(search_terms)
    url = "https://gutendex.com/books"
    response = requests.get(url, params={"search": search_query})

    simplified_results = []
    for book in response.json().get("results", []):
        simplified_results.append({
            "id": book.get("id"),
            "title": book.get("title"),
            "authors": book.get("authors")
        })

    return simplified_results

tools = [
  {
    "type": "function",
    "function": {
      "name": "search_gutenberg_books",
      "description": "Search for books in the Project Gutenberg library based on specified search terms",
      "parameters": {
        "type": "object",
        "properties": {
          "search_terms": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "List of search terms to find books in the Gutenberg library (e.g. ['dickens', 'great'] to search for books by Dickens with 'great' in the title)"
          }
        },
        "required": ["search_terms"]
      }
    }
  }
]

TOOL_MAPPING = {
    "search_gutenberg_books": search_gutenberg_books
}

```

```typescript
async function searchGutenbergBooks(searchTerms: string[]): Promise<Book[]> {
  const searchQuery = searchTerms.join(' ');
  const url = 'https://gutendex.com/books';
  const response = await fetch(`${url}?search=${searchQuery}`);
  const data = await response.json();

  return data.results.map((book: any) => ({
    id: book.id,
    title: book.title,
    authors: book.authors,
  }));
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'searchGutenbergBooks',
      description:
        'Search for books in the Project Gutenberg library based on specified search terms',
      parameters: {
        type: 'object',
        properties: {
          search_terms: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              "List of search terms to find books in the Gutenberg library (e.g. ['dickens', 'great'] to search for books by Dickens with 'great' in the title)",
          },
        },
        required: ['search_terms'],
      },
    },
  },
];

const TOOL_MAPPING = {
  searchGutenbergBooks,
};
```

</CodeGroup>
</Template>

Note that the "tool" is just a normal function. We then write a JSON "spec" compatible with the OpenAI function calling parameter. We'll pass that spec to the LLM so that it knows this tool is available and how to use it. It will request the tool when needed, along with any arguments. We'll then marshal the tool call locally, make the function call, and return the results to the LLM.

### Tool use and tool results

Let's make the first OpenRouter API call to the model:

<Template data={{
  API_KEY_REF,
  MODEL: 'google/gemini-2.0-flash-001'
}}>
<CodeGroup>

```python
request_1 = {
    "model": {{MODEL}},
    "tools": tools,
    "messages": messages
}

response_1 = openai_client.chat.completions.create(**request_1).message
```

```typescript
const request_1 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer {{API_KEY_REF}}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: '{{MODEL}}',
    tools,
    messages,
  }),
});

const data = await request_1.json();
const response_1 = data.choices[0].message;
```

</CodeGroup>
</Template>

The LLM responds with a finish reason of `tool_calls`, and a `tool_calls` array. In a generic LLM response-handler, you would want to check the `finish_reason` before processing tool calls, but here we will assume it's the case. Let's keep going, by processing the tool call:

<Template data={{
  API_KEY_REF,
  MODEL: 'google/gemini-2.0-flash-001'
}}>
<CodeGroup>

```python
# Append the response to the messages array so the LLM has the full context
# It's easy to forget this step!
messages.append(response_1)

# Now we process the requested tool calls, and use our book lookup tool
for tool_call in response_1.tool_calls:
    '''
    In this case we only provided one tool, so we know what function to call.
    When providing multiple tools, you can inspect `tool_call.function.name`
    to figure out what function you need to call locally.
    '''
    tool_name = tool_call.function.name
    tool_args = json.loads(tool_call.function.arguments)
    tool_response = TOOL_MAPPING[tool_name](**tool_args)
    messages.append({
      "role": "tool",
      "tool_call_id": tool_call.id,
      "name": tool_name,
      "content": json.dumps(tool_response),
    })
```

```typescript
// Append the response to the messages array so the LLM has the full context
// It's easy to forget this step!
messages.push(response_1);

// Now we process the requested tool calls, and use our book lookup tool
for (const toolCall of response_1.tool_calls) {
  const toolName = toolCall.function.name;
  const { search_params } = JSON.parse(toolCall.function.arguments);
  const toolResponse = await TOOL_MAPPING[toolName](search_params);
  messages.push({
    role: 'tool',
    toolCallId: toolCall.id,
    name: toolName,
    content: JSON.stringify(toolResponse),
  });
}
```

</CodeGroup>
</Template>

The messages array now has:

1. Our original request
2. The LLM's response (containing a tool call request)
3. The result of the tool call (a json object returned from the Project Gutenberg API)

Now, we can make a second OpenRouter API call, and hopefully get our result!

<Template data={{
  API_KEY_REF,
  MODEL: 'google/gemini-2.0-flash-001'
}}>
<CodeGroup>

```python
request_2 = {
  "model": MODEL,
  "messages": messages,
  "tools": tools
}

response_2 = openai_client.chat.completions.create(**request_2)

print(response_2.choices[0].message.content)
```

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer {{API_KEY_REF}}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: '{{MODEL}}',
    messages,
    tools,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

</CodeGroup>
</Template>

The output will be something like:

```text
Here are some books by James Joyce:

*   *Ulysses*
*   *Dubliners*
*   *A Portrait of the Artist as a Young Man*
*   *Chamber Music*
*   *Exiles: A Play in Three Acts*
```

We did it! We've successfully used a tool in a prompt.

## Interleaved Thinking

Interleaved thinking allows models to reason between tool calls, enabling more sophisticated decision-making after receiving tool results. This feature helps models chain multiple tool calls with reasoning steps in between and make nuanced decisions based on intermediate results.

**Important**: Interleaved thinking increases token usage and response latency. Consider your budget and performance requirements when enabling this feature.

### How Interleaved Thinking Works

With interleaved thinking, the model can:

- Reason about the results of a tool call before deciding what to do next
- Chain multiple tool calls with reasoning steps in between  
- Make more nuanced decisions based on intermediate results
- Provide transparent reasoning for its tool selection process

### Example: Multi-Step Research with Reasoning

Here's an example showing how a model might use interleaved thinking to research a topic across multiple sources:

**Initial Request:**
```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "Research the environmental impact of electric vehicles and provide a comprehensive analysis."
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_academic_papers",
        "description": "Search for academic papers on a given topic",
        "parameters": {
          "type": "object",
          "properties": {
            "query": {"type": "string"},
            "field": {"type": "string"}
          },
          "required": ["query"]
        }
      }
    },
    {
      "type": "function", 
      "function": {
        "name": "get_latest_statistics",
        "description": "Get latest statistics on a topic",
        "parameters": {
          "type": "object",
          "properties": {
            "topic": {"type": "string"},
            "year": {"type": "integer"}
          },
          "required": ["topic"]
        }
      }
    }
  ]
}
```

**Model's Reasoning and Tool Calls:**

1. **Initial Thinking**: "I need to research electric vehicle environmental impact. Let me start with academic papers to get peer-reviewed research."

2. **First Tool Call**: `search_academic_papers({"query": "electric vehicle lifecycle environmental impact", "field": "environmental science"})`

3. **After First Tool Result**: "The papers show mixed results on manufacturing impact. I need current statistics to complement this academic research."

4. **Second Tool Call**: `get_latest_statistics({"topic": "electric vehicle carbon footprint", "year": 2024})`

5. **After Second Tool Result**: "Now I have both academic research and current data. Let me search for manufacturing-specific studies to address the gaps I found."

6. **Third Tool Call**: `search_academic_papers({"query": "electric vehicle battery manufacturing environmental cost", "field": "materials science"})`

7. **Final Analysis**: Synthesizes all gathered information into a comprehensive response.

### Best Practices for Interleaved Thinking

- **Clear Tool Descriptions**: Provide detailed descriptions so the model can reason about when to use each tool
- **Structured Parameters**: Use well-defined parameter schemas to help the model make precise tool calls
- **Context Preservation**: Maintain conversation context across multiple tool interactions
- **Error Handling**: Design tools to provide meaningful error messages that help the model adjust its approach

### Implementation Considerations

When implementing interleaved thinking:

- Models may take longer to respond due to additional reasoning steps
- Token usage will be higher due to the reasoning process
- The quality of reasoning depends on the model's capabilities
- Some models may be better suited for this approach than others

## A Simple Agentic Loop

In the example above, the calls are made explicitly and sequentially. To handle a wide variety of user inputs and tool calls, you can use an agentic loop.

Here's an example of a simple agentic loop (using the same `tools` and initial `messages` as above):

<Template data={{
  API_KEY_REF,
  MODEL: 'google/gemini-2.0-flash-001'
}}>
<CodeGroup>

```python

def call_llm(msgs):
    resp = openai_client.chat.completions.create(
        model={{MODEL}},
        tools=tools,
        messages=msgs
    )
    msgs.append(resp.choices[0].message.dict())
    return resp

def get_tool_response(response):
    tool_call = response.choices[0].message.tool_calls[0]
    tool_name = tool_call.function.name
    tool_args = json.loads(tool_call.function.arguments)

    # Look up the correct tool locally, and call it with the provided arguments
    # Other tools can be added without changing the agentic loop
    tool_result = TOOL_MAPPING[tool_name](**tool_args)

    return {
        "role": "tool",
        "tool_call_id": tool_call.id,
        "name": tool_name,
        "content": tool_result,
    }

max_iterations = 10
iteration_count = 0

while iteration_count < max_iterations:
    iteration_count += 1
    resp = call_llm(_messages)

    if resp.choices[0].message.tool_calls is not None:
        messages.append(get_tool_response(resp))
    else:
        break

if iteration_count >= max_iterations:
    print("Warning: Maximum iterations reached")

print(messages[-1]['content'])

```

```typescript
async function callLLM(messages: Message[]): Promise<Message> {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer {{API_KEY_REF}}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: '{{MODEL}}',
        tools,
        messages,
      }),
    },
  );

  const data = await response.json();
  messages.push(data.choices[0].message);
  return data;
}

async function getToolResponse(response: Message): Promise<Message> {
  const toolCall = response.toolCalls[0];
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments);

  // Look up the correct tool locally, and call it with the provided arguments
  // Other tools can be added without changing the agentic loop
  const toolResult = await TOOL_MAPPING[toolName](toolArgs);

  return {
    role: 'tool',
    toolCallId: toolCall.id,
    name: toolName,
    content: toolResult,
  };
}

const maxIterations = 10;
let iterationCount = 0;

while (iterationCount < maxIterations) {
  iterationCount++;
  const response = await callLLM(messages);

  if (response.toolCalls) {
    messages.push(await getToolResponse(response));
  } else {
    break;
  }
}

if (iterationCount >= maxIterations) {
  console.warn("Warning: Maximum iterations reached");
}

console.log(messages[messages.length - 1].content);
```

</CodeGroup>
</Template>

## Best Practices and Advanced Patterns

### Function Definition Guidelines

When defining tools for LLMs, follow these best practices:

**Clear and Descriptive Names**: Use descriptive function names that clearly indicate the tool's purpose.

```json
// Good: Clear and specific
{ "name": "get_weather_forecast" }
```

```json
// Avoid: Too vague
{ "name": "weather" }
```

**Comprehensive Descriptions**: Provide detailed descriptions that help the model understand when and how to use the tool.

```json
{
  "description": "Get current weather conditions and 5-day forecast for a specific location. Supports cities, zip codes, and coordinates.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City name, zip code, or coordinates (lat,lng). Examples: 'New York', '10001', '40.7128,-74.0060'"
      },
      "units": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "Temperature unit preference",
        "default": "celsius"
      }
    },
    "required": ["location"]
  }
}
```

### Streaming with Tool Calls

When using streaming responses with tool calls, handle the different content types appropriately:

```typescript
const stream = await fetch('/api/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'anthropic/claude-3.5-sonnet',
    messages: messages,
    tools: tools,
    stream: true
  })
});

const reader = stream.body.getReader();
let toolCalls = [];

while (true) {
  const { done, value } = await reader.read();
  if (done) {
    break;
  }
  
  const chunk = new TextDecoder().decode(value);
  const lines = chunk.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.choices[0].delta.tool_calls) {
        toolCalls.push(...data.choices[0].delta.tool_calls);
      }
      
      if (data.choices[0].delta.finish_reason === 'tool_calls') {
        await handleToolCalls(toolCalls);
      } else if (data.choices[0].delta.finish_reason === 'stop') {
        // Regular completion without tool calls
        break;
      }
    }
  }
}
```

### Tool Choice Configuration

Control tool usage with the `tool_choice` parameter:

```json
// Let model decide (default)
{ "tool_choice": "auto" }
```

```json
// Disable tool usage
{ "tool_choice": "none" }
```

```json
// Force specific tool
{
  "tool_choice": {
    "type": "function",
    "function": {"name": "search_database"}
  }
}
```

### Parallel Tool Calls

Control whether multiple tools can be called simultaneously with the `parallel_tool_calls` parameter (default is true for most models):

```json
// Disable parallel tool calls - tools will be called sequentially
{ "parallel_tool_calls": false }
```

When `parallel_tool_calls` is `false`, the model will only request one tool call at a time instead of potentially multiple calls in parallel.

### Multi-Tool Workflows

Design tools that work well together:

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_products",
        "description": "Search for products in the catalog"
      }
    },
    {
      "type": "function", 
      "function": {
        "name": "get_product_details",
        "description": "Get detailed information about a specific product"
      }
    },
    {
      "type": "function",
      "function": {
        "name": "check_inventory",
        "description": "Check current inventory levels for a product"
      }
    }
  ]
}
```

This allows the model to naturally chain operations: search → get details → check inventory.

For more details on OpenRouter's message format and tool parameters, see the [API Reference](https://openrouter.ai/docs/api-reference/overview).
---
title: Structured Outputs
subtitle: Return structured data from your models
headline: Structured Outputs | Enforce JSON Schema in OpenRouter API Responses
canonical-url: 'https://openrouter.ai/docs/features/structured-outputs'
'og:site_name': OpenRouter Documentation
'og:title': Structured Outputs - Type-Safe JSON Responses from AI Models
'og:description': >-
  Enforce JSON Schema validation on AI model responses. Get consistent,
  type-safe outputs and avoid parsing errors with OpenRouter's structured output
  feature.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?title=Structured%20Outputs&description=Type-Safe%20JSON%20Responses%20from%20AI%20Models
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

import { API_KEY_REF } from '../../../imports/constants';

OpenRouter supports structured outputs for compatible models, ensuring responses follow a specific JSON Schema format. This feature is particularly useful when you need consistent, well-formatted responses that can be reliably parsed by your application.

## Overview

Structured outputs allow you to:

- Enforce specific JSON Schema validation on model responses
- Get consistent, type-safe outputs
- Avoid parsing errors and hallucinated fields
- Simplify response handling in your application

## Using Structured Outputs

To use structured outputs, include a `response_format` parameter in your request, with `type` set to `json_schema` and the `json_schema` object containing your schema:

```typescript
{
  "messages": [
    { "role": "user", "content": "What's the weather like in London?" }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "weather",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "City or location name"
          },
          "temperature": {
            "type": "number",
            "description": "Temperature in Celsius"
          },
          "conditions": {
            "type": "string",
            "description": "Weather conditions description"
          }
        },
        "required": ["location", "temperature", "conditions"],
        "additionalProperties": false
      }
    }
  }
}
```

The model will respond with a JSON object that strictly follows your schema:

```json
{
  "location": "London",
  "temperature": 18,
  "conditions": "Partly cloudy with light drizzle"
}
```

## Model Support

Structured outputs are supported by select models.

You can find a list of models that support structured outputs on the [models page](https://openrouter.ai/models?order=newest&supported_parameters=structured_outputs).

- OpenAI models (GPT-4o and later versions) [Docs](https://platform.openai.com/docs/guides/structured-outputs)
- All Fireworks provided models [Docs](https://docs.fireworks.ai/structured-responses/structured-response-formatting#structured-response-modes)

To ensure your chosen model supports structured outputs:

1. Check the model's supported parameters on the [models page](https://openrouter.ai/models)
2. Set `require_parameters: true` in your provider preferences (see [Provider Routing](/docs/features/provider-routing))
3. Include `response_format` and set `type: json_schema` in the required parameters

## Best Practices

1. **Include descriptions**: Add clear descriptions to your schema properties to guide the model

2. **Use strict mode**: Always set `strict: true` to ensure the model follows your schema exactly

## Example Implementation

Here's a complete example using the Fetch API:

<Template data={{
  API_KEY_REF,
  MODEL: 'openai/gpt-4'
}}>
<CodeGroup>

```typescript title="With TypeScript"
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer {{API_KEY_REF}}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: '{{MODEL}}',
    messages: [
      { role: 'user', content: 'What is the weather like in London?' },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'weather',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City or location name',
            },
            temperature: {
              type: 'number',
              description: 'Temperature in Celsius',
            },
            conditions: {
              type: 'string',
              description: 'Weather conditions description',
            },
          },
          required: ['location', 'temperature', 'conditions'],
          additionalProperties: false,
        },
      },
    },
  }),
});

const data = await response.json();
const weatherInfo = data.choices[0].message.content;
```

```python title="With Python"
import requests
import json

response = requests.post(
  "https://openrouter.ai/api/v1/chat/completions",
  headers={
    "Authorization": f"Bearer {{API_KEY_REF}}",
    "Content-Type": "application/json",
  },

  json={
    "model": "{{MODEL}}",
    "messages": [
      {"role": "user", "content": "What is the weather like in London?"},
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "weather",
        "strict": True,
        "schema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City or location name",
            },
            "temperature": {
              "type": "number",
              "description": "Temperature in Celsius",
            },
            "conditions": {
              "type": "string",
              "description": "Weather conditions description",
            },
          },
          "required": ["location", "temperature", "conditions"],
          "additionalProperties": False,
        },
      },
    },
  },
)

data = response.json()
weather_info = data["choices"][0]["message"]["content"]
```

</CodeGroup>

</Template>

## Streaming with Structured Outputs

Structured outputs are also supported with streaming responses. The model will stream valid partial JSON that, when complete, forms a valid response matching your schema.

To enable streaming with structured outputs, simply add `stream: true` to your request:

```typescript
{
  "stream": true,
  "response_format": {
    "type": "json_schema",
    // ... rest of your schema
  }
}
```

## Error Handling

When using structured outputs, you may encounter these scenarios:

1. **Model doesn't support structured outputs**: The request will fail with an error indicating lack of support
2. **Invalid schema**: The model will return an error if your JSON Schema is invalid
---
title: Prompt Caching
subtitle: Cache prompt messages
headline: Prompt Caching | Reduce AI Model Costs with OpenRouter
canonical-url: 'https://openrouter.ai/docs/features/prompt-caching'
'og:site_name': OpenRouter Documentation
'og:title': Prompt Caching - Optimize AI Model Costs with Smart Caching
'og:description': >-
  Reduce your AI model costs with OpenRouter's prompt caching feature. Learn how
  to cache and reuse responses across OpenAI, Anthropic Claude, and DeepSeek
  models.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?title=Prompt%20Caching&description=Optimize%20AI%20model%20costs%20with%20OpenRouter
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

import {
  ANTHROPIC_CACHE_READ_MULTIPLIER,
  ANTHROPIC_CACHE_WRITE_MULTIPLIER,
  DEEPSEEK_CACHE_READ_MULTIPLIER,
  GOOGLE_CACHE_MIN_TOKENS_2_5_FLASH,
  GOOGLE_CACHE_MIN_TOKENS_2_5_PRO,
  GOOGLE_CACHE_READ_MULTIPLIER,
  GROK_CACHE_READ_MULTIPLIER,
} from '../../../imports/constants';

To save on inference costs, you can enable prompt caching on supported providers and models.

Most providers automatically enable prompt caching, but note that some (see Anthropic below) require you to enable it on a per-message basis.

When using caching (whether automatically in supported models, or via the `cache_control` property), OpenRouter will make a best-effort to continue routing to the same provider to make use of the warm cache. In the event that the provider with your cached prompt is not available, OpenRouter will try the next-best provider.

## Inspecting cache usage

To see how much caching saved on each generation, you can:

1. Click the detail button on the [Activity](/activity) page
2. Use the `/api/v1/generation` API, [documented here](/api-reference/overview#querying-cost-and-stats)
3. Use `usage: {include: true}` in your request to get the cache tokens at the end of the response (see [Usage Accounting](/use-cases/usage-accounting) for details)

The `cache_discount` field in the response body will tell you how much the response saved on cache usage. Some providers, like Anthropic, will have a negative discount on cache writes, but a positive discount (which reduces total cost) on cache reads.

## OpenAI

Caching price changes:

- **Cache writes**: no cost
- **Cache reads**: (depending on the model) charged at 0.25x or 0.50x the price of the original input pricing

[Click here to view OpenAI's cache pricing per model.](https://platform.openai.com/docs/pricing)

Prompt caching with OpenAI is automated and does not require any additional configuration. There is a minimum prompt size of 1024 tokens.

[Click here to read more about OpenAI prompt caching and its limitation.](https://platform.openai.com/docs/guides/prompt-caching)

## Grok

Caching price changes:

- **Cache writes**: no cost
- **Cache reads**: charged at {GROK_CACHE_READ_MULTIPLIER}x the price of the original input pricing

[Click here to view Grok's cache pricing per model.](https://docs.x.ai/docs/models#models-and-pricing)

Prompt caching with Grok is automated and does not require any additional configuration.

## Anthropic Claude

Caching price changes:

- **Cache writes**: charged at {ANTHROPIC_CACHE_WRITE_MULTIPLIER}x the price of the original input pricing
- **Cache reads**: charged at {ANTHROPIC_CACHE_READ_MULTIPLIER}x the price of the original input pricing

Prompt caching with Anthropic requires the use of `cache_control` breakpoints. There is a limit of four breakpoints, and the cache will expire within five minutes. Therefore, it is recommended to reserve the cache breakpoints for large bodies of text, such as character cards, CSV data, RAG data, book chapters, etc.

[Click here to read more about Anthropic prompt caching and its limitation.](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

The `cache_control` breakpoint can only be inserted into the text part of a multipart message.

System message caching example:

```json
{
  "messages": [
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "You are a historian studying the fall of the Roman Empire. You know the following book very well:"
        },
        {
          "type": "text",
          "text": "HUGE TEXT BODY",
          "cache_control": {
            "type": "ephemeral"
          }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What triggered the collapse?"
        }
      ]
    }
  ]
}
```

User message caching example:

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Given the book below:"
        },
        {
          "type": "text",
          "text": "HUGE TEXT BODY",
          "cache_control": {
            "type": "ephemeral"
          }
        },
        {
          "type": "text",
          "text": "Name all the characters in the above book"
        }
      ]
    }
  ]
}
```

## DeepSeek

Caching price changes:

- **Cache writes**: charged at the same price as the original input pricing
- **Cache reads**: charged at {DEEPSEEK_CACHE_READ_MULTIPLIER}x the price of the original input pricing

Prompt caching with DeepSeek is automated and does not require any additional configuration.

## Google Gemini

### Implicit Caching

Gemini 2.5 Pro and 2.5 Flash models now support **implicit caching**, providing automatic caching functionality similar to OpenAI’s automatic caching. Implicit caching works seamlessly — no manual setup or additional `cache_control` breakpoints required.

Pricing Changes:

- No cache write or storage costs.
- Cached tokens are charged at {GOOGLE_CACHE_READ_MULTIPLIER}x the original input token cost.

Note that the TTL is on average 3-5 minutes, but will vary. There is a minimum of {GOOGLE_CACHE_MIN_TOKENS_2_5_FLASH} tokens for Gemini 2.5 Flash, and {GOOGLE_CACHE_MIN_TOKENS_2_5_PRO} tokens for Gemini 2.5 Pro for requests to be eligible for caching.

[Official announcement from Google](https://developers.googleblog.com/en/gemini-2-5-models-now-support-implicit-caching/)

<Tip>
  To maximize implicit cache hits, keep the initial portion of your message
  arrays consistent between requests. Push variations (such as user questions or
  dynamic context elements) toward the end of your prompt/requests.
</Tip>

### Pricing Changes for Cached Requests:

- **Cache Writes:** Charged at the input token cost plus 5 minutes of cache storage, calculated as follows:

```
Cache write cost = Input token price + (Cache storage price × (5 minutes / 60 minutes))
```

- **Cache Reads:** Charged at {GOOGLE_CACHE_READ_MULTIPLIER}× the original input token cost.

### Supported Models and Limitations:

Only certain Gemini models support caching. Please consult Google's [Gemini API Pricing Documentation](https://ai.google.dev/gemini-api/docs/pricing) for the most current details.

Cache Writes have a 5 minute Time-to-Live (TTL) that does not update. After 5 minutes, the cache expires and a new cache must be written.

Gemini models have typically have a 4096 token minimum for cache write to occur. Cached tokens count towards the model's maximum token usage. Gemini 2.5 Pro has a minimum of {GOOGLE_CACHE_MIN_TOKENS_2_5_PRO} tokens, and Gemini 2.5 Flash has a minimum of {GOOGLE_CACHE_MIN_TOKENS_2_5_FLASH} tokens.

### How Gemini Prompt Caching works on OpenRouter:

OpenRouter simplifies Gemini cache management, abstracting away complexities:

- You **do not** need to manually create, update, or delete caches.
- You **do not** need to manage cache names or TTL explicitly.

### How to Enable Gemini Prompt Caching:

Gemini caching in OpenRouter requires you to insert `cache_control` breakpoints explicitly within message content, similar to Anthropic. We recommend using caching primarily for large content pieces (such as CSV files, lengthy character cards, retrieval augmented generation (RAG) data, or extensive textual sources).

<Tip>
  There is not a limit on the number of `cache_control` breakpoints you can
  include in your request. OpenRouter will use only the last breakpoint for
  Gemini caching. Including multiple breakpoints is safe and can help maintain
  compatibility with Anthropic, but only the final one will be used for Gemini.
</Tip>

### Examples:

#### System Message Caching Example

```json
{
  "messages": [
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "You are a historian studying the fall of the Roman Empire. Below is an extensive reference book:"
        },
        {
          "type": "text",
          "text": "HUGE TEXT BODY HERE",
          "cache_control": {
            "type": "ephemeral"
          }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What triggered the collapse?"
        }
      ]
    }
  ]
}
```

#### User Message Caching Example

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Based on the book text below:"
        },
        {
          "type": "text",
          "text": "HUGE TEXT BODY HERE",
          "cache_control": {
            "type": "ephemeral"
          }
        },
        {
          "type": "text",
          "text": "List all main characters mentioned in the text above."
        }
      ]
    }
  ]
}
```

---
title: Presets
subtitle: Manage your LLM configurations
headline: Presets | Configuration Management for AI Models
canonical-url: 'https://openrouter.ai/docs/features/presets'
'og:site_name': OpenRouter Documentation
'og:title': Presets - Configuration Management for AI Models
'og:description': >-
  Learn how to use OpenRouter's presets to manage model configurations, system
  prompts, and parameters across your applications.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?title=Presets&description=Configuration%20management%20for%20AI%20models
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

[Presets](/settings/presets) allow you to separate your LLM configuration from your code. Create and manage presets through the OpenRouter web application to control provider routing, model selection, system prompts, and other parameters, then reference them in OpenRouter API requests.

## What are Presets?

Presets are named configurations that encapsulate all the settings needed for a specific use case. For example, you might create:

- An "email-copywriter" preset for generating marketing copy
- An "inbound-classifier" preset for categorizing customer inquiries
- A "code-reviewer" preset for analyzing pull requests

Each preset can manage:

- Provider routing preferences (sort by price, latency, etc.)
- Model selection (specific model or array of models with fallbacks)
- System prompts
- Generation parameters (temperature, top_p, etc.)
- Provider inclusion/exclusion rules

## Quick Start

1. [Create a preset](/settings/presets). For example, select a model and restrict provider routing to just a few providers.
![Creating a new preset](file:6f9615d7-b2f0-4873-8396-ca845474267a "A new preset")

2. Make an API request to the preset:
```json
{
  "model": "@preset/ravenel-bridge",
  "messages": [
    {
      "role": "user",
      "content": "What's your opinion of the Golden Gate Bridge? Isn't it beautiful?"
    }
  ]
}
```

## Benefits

### Separation of Concerns

Presets help you maintain a clean separation between your application code and LLM configuration. This makes your code more semantic and easier to maintain.

### Rapid Iteration

Update your LLM configuration without deploying code changes:
- Switch to new model versions
- Adjust system prompts
- Modify parameters
- Change provider preferences

## Using Presets

There are three ways to use presets in your API requests.

1. **Direct Model Reference**

You can reference the preset as if it was a model by sending requests to `@preset/preset-slug`

```json
{
  "model": "@preset/email-copywriter",
  "messages": [
    {
      "role": "user",
      "content": "Write a marketing email about our new feature"
    }
  ]
}
```

2. **Preset Field**
```json
{
  "model": "openai/gpt-4",
  "preset": "email-copywriter",
  "messages": [
    {
      "role": "user",
      "content": "Write a marketing email about our new feature"
    }
  ]
}
```

3. **Combined Model and Preset**
```json
{
  "model": "openai/gpt-4@preset/email-copywriter",
  "messages": [
    {
      "role": "user",
      "content": "Write a marketing email about our new feature"
    }
  ]
}
```

## Other Notes

1. If you're using an organization account, all members can access organization presets. This is a great way to share best practices across teams.
2. Version history is kept in order to understand changes that were made, and to be able to roll back. However when addressing a preset through the API, the latest version is always used.
3. If you provide parameters in the request, they will be shallow-merged with the options configured in the preset.


---
title: Latency and Performance
subtitle: Understanding OpenRouter's performance characteristics
headline: Latency and Performance | Minimizing Gateway Latency
canonical-url: 'https://openrouter.ai/docs/features/latency-and-performance'
'og:site_name': OpenRouter Documentation
'og:title': Latency and Performance | Minimizing Gateway Latency
'og:description': >-
  Learn about OpenRouter's performance characteristics, latency optimizations,
  and best practices for achieving optimal response times.
'og:image':
  type: url
  value: >-
    https://openrouter.ai/dynamic-og?title=Latency%20and%20Performance&description=Understanding%20OpenRouter's%20performance%20characteristics
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary_large_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---

OpenRouter is designed with performance as a top priority. OpenRouter is heavily optimized to add as little latency as possible to your requests.

## Base Latency

Under typical production conditions, OpenRouter adds approximately 40ms of latency to your requests. This minimal overhead is achieved through:

- Edge computing using Cloudflare Workers to stay as close as possible to your application
- Efficient caching of user and API key data at the edge
- Optimized routing logic that minimizes processing time

## Performance Considerations

### Cache Warming

When OpenRouter's edge caches are cold (typically during the first 1-2 minutes of operation in a new region), you may experience slightly higher latency as the caches warm up. This normalizes once the caches are populated.

### Credit Balance Checks

To maintain accurate billing and prevent overages, OpenRouter performs additional database checks when:
- A user's credit balance is low (single digit dollars)
- An API key is approaching its configured credit limit

OpenRouter expires caches more aggressively under these conditions to ensure proper billing, which increases latency until additional credits are added.

### Model Fallback

When using [model routing](/docs/features/model-routing) or [provider routing](/docs/features/provider-routing), if the primary model or provider fails, OpenRouter will automatically try the next option. A failed initial completion unsurprisingly adds latency to the specific request. OpenRouter tracks provider failures, and will attempt to intelligently route around unavailable providers so that this latency is not incurred on every request.

## Best Practices

To achieve optimal performance with OpenRouter:

1. **Maintain Healthy Credit Balance**
   - Set up auto-topup with a higher threshold and amount
   - This helps avoid forced credit checks and reduces the risk of hitting zero balance
   - Recommended minimum balance: $10-20 to ensure smooth operation

2. **Use Provider Preferences**
   - If you have specific latency requirements (whether time to first token, or time to last), there are [provider routing](/docs/features/provider-routing) features to help you achieve your performance and cost goals.
