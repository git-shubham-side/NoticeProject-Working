import 'server-only';

import nodemailer from 'nodemailer';
import type { Notice, NoticeDeliveryChannels, NotificationPreferences, User } from '@/types';
import { readEnv } from './env';
import { getNotificationPreferences } from './notification-preferences';
import { getLocalizedNoticeContent } from './notice-assistant';

function getNormalizedChannels(channels?: Partial<NoticeDeliveryChannels>): NoticeDeliveryChannels {
  return {
    inApp: channels?.inApp ?? true,
    email: channels?.email ?? false,
  };
}

function shouldSendForPreferences(
  preferences: NotificationPreferences,
  notice: Notice,
  channel: 'email'
) {
  if (channel === 'email' && !preferences.emailNotifications) {
    return false;
  }

  if (notice.priority === 'urgent') {
    return preferences.notifyUrgent;
  }

  return preferences.notifyNewNotices;
}

function getMailTransport() {
  const host = readEnv('SMTP_HOST');
  const port = readEnv('SMTP_PORT') ? parseInt(readEnv('SMTP_PORT') as string, 10) : undefined;
  const user = readEnv('SMTP_USER');
  const pass = readEnv('SMTP_PASS')?.replace(/\s+/g, '');

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function isDataUrl(value: string) {
  return value.startsWith('data:');
}

function getAttachmentSummary(notice: Notice) {
  if (notice.attachments.length === 0) {
    return '';
  }

  const suffix = notice.attachments.length === 1 ? '' : 's';
  const fileNames = notice.attachments.map(attachment => attachment.name).join(', ');
  return `\n\nAttachment${suffix}: ${fileNames}`;
}

function getHtmlAttachmentSummary(notice: Notice) {
  if (notice.attachments.length === 0) {
    return '';
  }

  return `
    <div style="margin-top: 16px;">
      <strong>Attachments:</strong>
      <ul>
        ${notice.attachments.map(attachment => `<li>${attachment.name}</li>`).join('')}
      </ul>
    </div>
  `;
}

function buildMailAttachments(notice: Notice) {
  return notice.attachments
    .filter(attachment => isDataUrl(attachment.url))
    .map(attachment => ({
      filename: attachment.name,
      path: attachment.url,
      contentType: attachment.type || undefined,
    }));
}

export function getDeliveryChannelStatus() {
  return {
    emailConfigured: Boolean(
      readEnv('SMTP_HOST') &&
        readEnv('SMTP_PORT') &&
        readEnv('SMTP_USER') &&
        readEnv('SMTP_PASS') &&
        readEnv('SMTP_FROM')
    ),
  };
}

export async function deliverNoticeChannels(
  notice: Notice,
  recipients: User[],
  channels?: Partial<NoticeDeliveryChannels>
) {
  const normalizedChannels = getNormalizedChannels(channels);

  if (normalizedChannels.email) {
    await sendNoticeEmails(notice, recipients);
  }
}

async function sendNoticeEmails(notice: Notice, recipients: User[]) {
  const transporter = getMailTransport();
  const from = readEnv('SMTP_FROM');

  if (!transporter || !from) {
    return;
  }

  const optedInRecipients = recipients.filter(recipient => {
    const preferences = getNotificationPreferences(recipient.id);
    return shouldSendForPreferences(preferences, notice, 'email');
  });

  if (optedInRecipients.length === 0) {
    return;
  }

  try {
    await Promise.all(
      optedInRecipients.map(recipient =>
        transporter.sendMail({
          from,
          to: recipient.email,
          subject: `${notice.priority === 'urgent' ? '[URGENT] ' : ''}${getLocalizedNoticeContent(notice, recipient.preferredLanguage ?? 'en').title}`,
          text: `${getLocalizedNoticeContent(notice, recipient.preferredLanguage ?? 'en').content}${getAttachmentSummary(notice)}\n\nOpen the notice board to read more.`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
              <h2>${getLocalizedNoticeContent(notice, recipient.preferredLanguage ?? 'en').title}</h2>
              <p>${getLocalizedNoticeContent(notice, recipient.preferredLanguage ?? 'en').content.replace(/\n/g, '<br />')}</p>
              <p><strong>Priority:</strong> ${notice.priority}</p>
              ${getHtmlAttachmentSummary(notice)}
            </div>
          `,
          attachments: buildMailAttachments(notice),
        })
      )
    );
  } catch (error) {
    console.error('Email delivery failed:', error);
  }
}
