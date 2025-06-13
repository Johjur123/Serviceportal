# Communication Channels Integration Guide

## Overview
This guide shows you how to connect WhatsApp, Instagram, Facebook, Email, and Phone channels to your Multi-Channel Customer Service Hub.

## 1. WhatsApp Business API Integration

### Prerequisites
- WhatsApp Business Account
- Meta Business Account
- WhatsApp Business API access

### Setup Steps
1. **Get WhatsApp Business API Credentials**
   - Go to Meta for Developers (developers.facebook.com)
   - Create a new app or use existing one
   - Add WhatsApp Business API product
   - Get your Phone Number ID and Access Token

2. **Configure Webhook**
   - Set webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
   - Verify token: Use a secure random string
   - Subscribe to messages, message_status events

3. **Add Environment Variables**
   ```bash
   WHATSAPP_ACCESS_TOKEN=your_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_VERIFY_TOKEN=your_verify_token
   ```

### Implementation Example
```javascript
// server/webhooks/whatsapp.js
app.post('/api/webhooks/whatsapp', (req, res) => {
  const { entry } = req.body;
  
  entry.forEach(item => {
    item.changes.forEach(change => {
      if (change.field === 'messages') {
        const messages = change.value.messages;
        messages.forEach(async (message) => {
          await processWhatsAppMessage(message);
        });
      }
    });
  });
  
  res.sendStatus(200);
});

async function processWhatsAppMessage(message) {
  // Create or find customer
  const customer = await findOrCreateCustomer({
    whatsappNumber: message.from,
    name: message.profile?.name || 'WhatsApp User'
  });
  
  // Create or find conversation
  const conversation = await findOrCreateConversation({
    customerId: customer.id,
    channel: 'whatsapp'
  });
  
  // Save message
  await storage.createMessage({
    conversationId: conversation.id,
    content: message.text?.body || 'Media message',
    senderType: 'customer',
    senderId: message.from
  });
}
```

## 2. Instagram Business API Integration

### Prerequisites
- Instagram Business Account
- Meta Business Account
- Instagram Basic Display API access

### Setup Steps
1. **Get Instagram Credentials**
   - Go to Meta for Developers
   - Add Instagram Basic Display API
   - Get App ID and App Secret

2. **Configure Webhook**
   - Set webhook URL: `https://your-domain.com/api/webhooks/instagram`
   - Subscribe to messages, messaging_postbacks

3. **Add Environment Variables**
   ```bash
   INSTAGRAM_ACCESS_TOKEN=your_access_token
   INSTAGRAM_APP_SECRET=your_app_secret
   INSTAGRAM_VERIFY_TOKEN=your_verify_token
   ```

### Implementation Example
```javascript
// server/webhooks/instagram.js
app.post('/api/webhooks/instagram', (req, res) => {
  const { entry } = req.body;
  
  entry.forEach(item => {
    item.messaging?.forEach(async (event) => {
      if (event.message) {
        await processInstagramMessage(event);
      }
    });
  });
  
  res.sendStatus(200);
});
```

## 3. Facebook Messenger Integration

### Prerequisites
- Facebook Page
- Meta Business Account
- Messenger Platform access

### Setup Steps
1. **Get Facebook Page Access Token**
   - Go to Meta for Developers
   - Add Messenger product to your app
   - Generate Page Access Token

2. **Configure Webhook**
   - Set webhook URL: `https://your-domain.com/api/webhooks/facebook`
   - Subscribe to messages, messaging_postbacks

3. **Add Environment Variables**
   ```bash
   FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
   FACEBOOK_VERIFY_TOKEN=your_verify_token
   ```

## 4. Email Integration (IMAP/SMTP)

### Prerequisites
- Email provider (Gmail, Outlook, etc.)
- IMAP/SMTP access enabled

### Setup Steps
1. **Configure Email Provider**
   - Enable IMAP/SMTP in your email settings
   - Generate app-specific password if using 2FA

2. **Add Environment Variables**
   ```bash
   EMAIL_IMAP_HOST=imap.gmail.com
   EMAIL_IMAP_PORT=993
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   EMAIL_USERNAME=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

### Implementation Example
```javascript
// server/email/emailService.js
const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async startImapListener() {
    const client = new ImapFlow({
      host: process.env.EMAIL_IMAP_HOST,
      port: process.env.EMAIL_IMAP_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await client.connect();
    await client.mailboxOpen('INBOX');

    client.on('exists', async (data) => {
      for await (let message of client.fetch('1:*', { envelope: true, bodyText: true })) {
        await this.processEmailMessage(message);
      }
    });
  }

  async processEmailMessage(message) {
    const customer = await findOrCreateCustomer({
      email: message.envelope.from[0].address,
      name: message.envelope.from[0].name || 'Email User'
    });

    const conversation = await findOrCreateConversation({
      customerId: customer.id,
      channel: 'email'
    });

    await storage.createMessage({
      conversationId: conversation.id,
      content: message.bodyText.value,
      senderType: 'customer',
      senderId: message.envelope.from[0].address
    });
  }
}
```

## 5. Phone Integration (VoIP/SIP)

### Prerequisites
- VoIP provider (Twilio, Vonage, etc.)
- SIP credentials

### Setup with Twilio
1. **Get Twilio Credentials**
   - Sign up at twilio.com
   - Get Account SID and Auth Token
   - Purchase phone number

2. **Add Environment Variables**
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

### Implementation Example
```javascript
// server/phone/twilioService.js
const twilio = require('twilio');

class PhoneService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async handleIncomingCall(req, res) {
    const from = req.body.From;
    const to = req.body.To;

    // Create or find customer
    const customer = await findOrCreateCustomer({
      phone: from,
      name: 'Phone User'
    });

    // Create conversation
    const conversation = await findOrCreateConversation({
      customerId: customer.id,
      channel: 'phone'
    });

    // Log call
    await storage.createMessage({
      conversationId: conversation.id,
      content: `Incoming call from ${from}`,
      senderType: 'customer',
      senderId: from
    });

    // TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Thank you for calling. Please hold while we connect you.');
    twiml.dial('+1234567890'); // Your agent's number

    res.type('text/xml');
    res.send(twiml.toString());
  }
}
```

## Implementation in Your Application

### 1. Add Webhook Routes
```javascript
// server/routes.ts - Add these routes
app.post('/api/webhooks/whatsapp', webhookMiddleware, handleWhatsAppWebhook);
app.post('/api/webhooks/instagram', webhookMiddleware, handleInstagramWebhook);
app.post('/api/webhooks/facebook', webhookMiddleware, handleFacebookWebhook);
app.post('/api/webhooks/phone', webhookMiddleware, handlePhoneWebhook);
```

### 2. Create Unified Message Handler
```javascript
// server/messageHandler.js
export async function processIncomingMessage(channelData) {
  const { channel, customerInfo, messageContent, externalId } = channelData;
  
  // Find or create customer
  const customer = await findOrCreateCustomer(customerInfo);
  
  // Find or create conversation
  const conversation = await findOrCreateConversation({
    customerId: customer.id,
    channel: channel
  });
  
  // Save message
  const message = await storage.createMessage({
    conversationId: conversation.id,
    content: messageContent,
    senderType: 'customer',
    senderId: externalId
  });
  
  // Notify agents via WebSocket
  wsManager.notifyNewMessage(customer.companyId, conversation.id, message);
  
  return message;
}
```

### 3. Add Channel-Specific Send Functions
```javascript
// server/channelSenders.js
export const channelSenders = {
  whatsapp: async (message, recipient) => {
    // Send via WhatsApp API
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        text: { body: message }
      })
    });
    return response.json();
  },
  
  email: async (message, recipient) => {
    // Send via SMTP
    return emailService.transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: recipient,
      subject: 'Customer Service Response',
      text: message
    });
  },
  
  // Add other channels...
};
```

## Required Environment Variables

Create a `.env` file with all the required credentials:

```bash
# WhatsApp
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_VERIFY_TOKEN=your_verify_token

# Facebook
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_token
FACEBOOK_VERIFY_TOKEN=your_verify_token

# Email
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Phone (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## Next Steps

1. **Choose your channels** - Start with 1-2 channels first
2. **Get API credentials** - Follow the setup steps for each channel
3. **Test webhooks** - Use ngrok or similar for local testing
4. **Implement gradually** - Add one channel at a time
5. **Monitor and debug** - Check logs and webhook delivery

## Support

For each channel, refer to their official documentation:
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Instagram API](https://developers.facebook.com/docs/instagram-api)
- [Facebook Messenger](https://developers.facebook.com/docs/messenger-platform)
- [Twilio Voice/SMS](https://www.twilio.com/docs)

The application is already prepared to handle multiple channels - you just need to add the specific API integrations for each channel you want to use.