import 'server-only';

import type { Notice, User } from '@/types';
import { readEnv } from './env';

type WhatsAppSendResult = {
  success: boolean;
  to: string;
  messageId?: string;
  error?: string;
};

type WhatsAppApiResponse = {
  messages?: Array<{ id: string }>;
  error?: {
    message?: string;
  };
};

function getWhatsAppConfig() {
  const accessToken = readEnv('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = readEnv('WHATSAPP_PHONE_NUMBER_ID');
  const apiVersion = readEnv('WHATSAPP_API_VERSION') || 'v23.0';
  const appUrl = readEnv('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';

  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return {
    accessToken,
    phoneNumberId,
    apiVersion,
    appUrl,
  };
}

export function isWhatsAppConfigured() {
  return Boolean(getWhatsAppConfig());
}

function normalizePhoneNumber(phone?: string) {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D+/g, '');
  return digits.length >= 10 ? digits : null;
}

function truncateMessage(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function buildNoticeLink(noticeId: string, appUrl: string) {
  return `${appUrl.replace(/\/$/, '')}/notices/${noticeId}`;
}

function buildWhatsAppNoticeMessage(notice: Notice, recipient: User, appUrl: string) {
  const localizedTitle = notice.translations?.find(
    translation => translation.language === (recipient.preferredLanguage ?? 'en')
  )?.title || notice.title;
  const localizedContent = notice.translations?.find(
    translation => translation.language === (recipient.preferredLanguage ?? 'en')
  )?.summary || notice.summary || notice.content;
  const link = buildNoticeLink(notice.id, appUrl);

  return [
    notice.priority === 'urgent' ? 'URGENT NOTICE' : 'New Notice',
    truncateMessage(localizedTitle, 50),
    truncateMessage(localizedContent.replace(/\s+/g, ' ').trim(), 70),
    `View: ${link}`,
  ].join('\n');
}

async function sendWhatsAppMessage(to: string, body: string): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();

  if (!config) {
    return {
      success: false,
      to,
      error: 'WhatsApp API is not configured.',
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body,
          },
        }),
      }
    );

    const data = (await response.json()) as WhatsAppApiResponse;

    if (!response.ok) {
      return {
        success: false,
        to,
        error: data.error?.message || 'Failed to send WhatsApp message.',
      };
    }

    return {
      success: true,
      to,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      success: false,
      to,
      error: error instanceof Error ? error.message : 'Unknown WhatsApp error.',
    };
  }
}

export async function sendNoticeWhatsAppNotifications(notice: Notice, recipients: User[]) {
  const config = getWhatsAppConfig();
  if (!config) {
    return [];
  }

  const studentRecipients = recipients.filter(recipient => recipient.role === 'student');

  const results = await Promise.all(
    studentRecipients.map(async (recipient) => {
      const normalizedPhone = normalizePhoneNumber(recipient.phone);
      if (!normalizedPhone) {
        return {
          success: false,
          to: recipient.phone || recipient.id,
          error: 'Missing or invalid student phone number.',
        } satisfies WhatsAppSendResult;
      }

      const message = buildWhatsAppNoticeMessage(notice, recipient, config.appUrl);
      return sendWhatsAppMessage(normalizedPhone, message);
    })
  );

  const failedResults = results.filter(result => !result.success);
  if (failedResults.length > 0) {
    console.error('WhatsApp delivery failed for some recipients:', failedResults);
  }

  return results;
}
