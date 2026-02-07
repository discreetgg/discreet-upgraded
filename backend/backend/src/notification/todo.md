## To add

- [] sendWebHookNotification
- [] EMail notification
- [] discord notification

<!-- async sendWebhookNotification(url: string, payload: any) {
  try {
    await axios.post(url, payload);
  } catch (error) {
    console.error('Webhook failed:', error.message);
  }
} -->

<!-- await this.notificationService.sendWebhookNotification(
  creator.webhookUrl,
  {
    event: 'plan_archived',
    planName: plan.planName,
    timestamp: Date.now(),
  },
); -->

<!-- async sendEmail(to: string, subject: string, body: string) {
const transporter = nodemailer.createTransport({
service: 'gmail', // or SendGrid, Mailgun, etc.
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS,
},
});
await transporter.sendMail({
from: '"YourApp" <no-reply@yourapp.com>',
to,
subject,
html: body,
});
} -->
