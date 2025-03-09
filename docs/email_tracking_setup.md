# Email Tracking Setup Guide

This guide explains how to set up email tracking in STRIKE using SendGrid.

## Overview

STRIKE now includes email tracking capabilities that allow you to:

1. Track when leads open your emails
2. Track when leads click links in your emails
3. Automatically update lead scores based on email engagement
4. Record email interactions in the activity timeline

## Prerequisites

- A SendGrid account with API access
- Your STRIKE instance properly configured with SendGrid API keys

## Configuration Steps

### 1. Configure SendGrid Event Webhook

1. Log in to your SendGrid account
2. Navigate to **Settings** > **Mail Settings**
3. Find and enable **Event Notification**
4. Set the HTTP Post URL to:
   ```
   https://your-strike-domain.com/api/v1/communications/webhook/sendgrid
   ```
5. Select the following events to track:
   - Processed
   - Delivered
   - Opened
   - Clicked
   - Bounced
   - Spam Report
   - Unsubscribe
   - Group Unsubscribe
   - Group Resubscribe
6. Set the **Authorization Method** to "None" (we handle authentication in our code)
7. Click **Save**

### 2. Test Your Configuration

1. Send a test email to yourself through STRIKE
2. Open the email and click any links
3. Check the lead's activity timeline to verify that the open and click events are recorded
4. Verify that the lead score has been updated

## How It Works

When you send an email through STRIKE:

1. The system adds tracking pixels and rewrites links to enable tracking
2. When a recipient opens the email, SendGrid records an "open" event
3. When a recipient clicks a link, SendGrid records a "click" event
4. SendGrid sends these events to your webhook endpoint
5. STRIKE processes these events and:
   - Updates the email status
   - Records the activity in the lead's timeline
   - Recalculates the lead's score

## Troubleshooting

### Email Events Not Being Tracked

1. Verify your SendGrid API key has full access
2. Check that the Event Webhook is properly configured
3. Ensure your STRIKE instance is accessible from the internet
4. Check your server logs for any webhook errors

### Lead Scores Not Updating

1. Verify that the email is associated with a lead
2. Check that the lead scoring service is running
3. Manually trigger a lead score recalculation

## Privacy Considerations

Email tracking involves collecting data about recipient behavior. Ensure your privacy policy discloses:

1. That you track email opens and clicks
2. How this data is used
3. How long this data is retained

## Additional Resources

- [SendGrid Event Webhook Documentation](https://docs.sendgrid.com/for-developers/tracking-events/event)
- [Email Privacy Best Practices](https://www.ftc.gov/business-guidance/privacy-security/email-marketing) 