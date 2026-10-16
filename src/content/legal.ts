// Legal page templates for an India-based agency (from the master plan, section 9).
// They are starting points, NOT legal advice. Replace every [bracketed] item and have an Indian
// lawyer review them before launch. While any [bracket] remains, the page shows a visible draft notice.

export interface LegalDoc {
  slug: string;
  title: string;
  description: string;
  body: string;
}

export const LEGAL: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms and Conditions",
    description: "The terms that apply when you use the GrovvIthUs website and order our services.",
    body: `Last updated: [date]

These Terms apply to your use of this website (the "Site") and the services provided by [Legal name of business, e.g. GrovvIthUs / proprietor or LLP], [address], India ("GrovvIthUs", "we", "us"). By using the Site or ordering a service you agree to these Terms. If you do not agree, please do not use the Site.

## 1. Services
We provide web development, software and app development, WordPress and Shopify work, digital marketing, SEO, AEO and GEO, video editing, graphic design, branding and related services. The exact scope, price, timeline and deliverables for each project are set out in a written quotation, proposal or Statement of Work ("SOW") that you accept by email, signature or online acceptance.

## 2. Quotes, payments and taxes
- Quotes are valid for [15] days.
- Unless the SOW says otherwise: [50]% advance before work starts, [40]% on design or milestone approval, and [10]% before final handover. Monthly services are paid in advance each month.
- Prices are in Indian rupees [or state currency] and exclude GST and third-party costs (domain, hosting, plugins, stock media, advertising spend), which you pay at actual cost.
- Invoices are due within [7] days. Late payments may pause work and attract interest of [1.5]% per month.
- We transfer final files and ownership only after full payment.

## 3. Client responsibilities
You will give us content, logins, approvals and feedback on time. Delays on your side may move the delivery dates. You confirm that all material you supply is yours or properly licensed, and that it does not break any law or third-party rights.

## 4. Revisions and change requests
The SOW states the number of revision rounds included ([2] by default). Extra rounds and work outside the agreed scope are quoted and charged separately.

## 5. Timelines
Dates are estimates and depend on timely client input. We are not liable for delays caused by the client, third-party platforms, or events outside our control.

## 6. Intellectual property
- After full payment, the client owns the final deliverables made specifically for them (designs, logos, videos, custom code), excluding third-party and open-source components, which stay under their own licences.
- We keep ownership of our pre-existing tools, templates, code libraries and know-how, and give the client a non-exclusive licence to use them inside the deliverable.
- Unless you tell us in writing not to, we may show completed work and the project name in our portfolio and marketing. We will not publish confidential information.

## 7. Confidentiality
Each party will keep the other's non-public business information confidential and use it only for the project. This does not apply to information that is public, already known, or required by law to be disclosed.

## 8. Third-party services
Projects may use third-party platforms (Hostinger, Shopify, Google, Meta, payment gateways, plugins). Their terms, prices and outages are outside our control. We are not responsible for account suspensions, policy changes or algorithm updates by those platforms.

## 9. No guarantee of results
SEO, AEO, GEO, social media and advertising results depend on many factors outside our control, including search engine and AI platform changes, competition and budget. We commit to the agreed activities and reports, not to specific rankings, traffic, leads or sales.

## 10. Warranty and support
We will fix defects in our own work that are reported within [30] days of delivery at no extra charge. Ongoing maintenance and support are available under a separate plan.

## 11. Limitation of liability
To the extent permitted by law, our total liability for any claim is limited to the amount you paid us for the specific service in the [3] months before the claim. We are not liable for indirect or consequential loss, loss of profit, data or goodwill.

## 12. Indemnity
You will compensate us for losses arising from content you provide that infringes rights or breaks the law.

## 13. Cancellation and termination
Either party may end a project with [14] days' written notice. You pay for work done and costs incurred until the end date. See our Refund and Cancellation Policy.

## 14. Website use
You must not misuse the Site, attempt unauthorised access, introduce malware, copy our content without permission, or use automated tools to harvest data. Content on the Site belongs to us or our licensors.

## 15. Privacy
We handle personal data as described in our Privacy Policy.

## 16. Governing law and disputes
These Terms are governed by the laws of India. Disputes will first be discussed in good faith for [30] days, then referred to arbitration under the Arbitration and Conciliation Act, 1996, by a sole arbitrator in [city], in English. Courts at [city] have exclusive jurisdiction for other matters.

## 17. Changes
We may update these Terms. The updated version applies from the date posted for new orders.

## 18. Contact and grievance officer
[Name], [email], [phone], [address]. We will acknowledge complaints within 48 hours and resolve them within [30] days.`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "What personal data GrovvIthUs collects, why, how it is protected and what choices you have.",
    body: `Last updated: [date]

GrovvIthUs ("we", "us") respects your privacy. This policy explains what personal data we collect through this website, why, how we protect it, and the choices you have. It follows the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000 [and, for visitors in the EU or UK, the GDPR].

## 1. Who is responsible
Data Fiduciary: [Legal name], [address]. Contact for privacy requests and grievances: [Name], [email], [phone].

## 2. What we collect
- Details you give us: name, email, phone, business name, service needed, timeline, project details, and any files you send.
- Client project data: logins, content, brand files and customer data you share so we can deliver the work (processed on your instructions).
- Technical data: IP address and basic request details, used to keep the site secure and prevent spam.
- Team accounts: name, email, role and login history for staff who use our admin panel.
We do not knowingly collect data from children under 18. We do not collect payment card numbers on this site.

## 3. Why we use it
- To reply to enquiries and prepare quotations.
- To deliver, support and invoice our services.
- To send news or offers, only if you opted in.
- To keep the site secure and prevent spam and fraud.
- To meet legal and tax obligations.

## 4. Consent and legal basis
We process personal data with your consent (when you submit a form), to perform a contract, or to meet legal duties. You can withdraw consent at any time by emailing [email]; this does not affect earlier lawful processing.

## 5. Who we share it with
Only service providers that help us run the business, under confidentiality terms: hosting (Hostinger), network security (Cloudflare), email delivery, [analytics, if enabled], payment gateway [Razorpay/Stripe], accountants and legal advisers. We do not sell your personal data. We may disclose data if required by law or court order.

## 6. International transfers
Some providers store or process data outside India. We choose providers with appropriate safeguards and transfer only what is needed.

## 7. How long we keep it
- Enquiries that do not become projects: [24] months.
- Client project records and invoices: [8] years (tax law).
- Marketing subscribers: until you unsubscribe.
After this we delete or anonymise the data.

## 8. Security
We use HTTPS, encrypted passwords, access controls, firewalls, backups and monitoring. No system is perfectly secure; if a breach affects your data we will notify you and the authorities as the law requires.

## 9. Your rights
You can ask to access your data, correct it, delete it, withdraw consent, nominate someone to act for you, and raise a grievance. Email [email]; we reply within [30] days (sooner where the law requires). If you are unhappy, you may complain to the Data Protection Board of India [or your local authority].

## 10. Cookies
See our Cookie Policy.

## 11. Links to other sites
We are not responsible for the privacy practices of other websites.

## 12. Changes
We will post changes on this page and update the date above. Significant changes will be notified by email or a notice on the site.`,
  },
  {
    slug: "refund-policy",
    title: "Refund and Cancellation Policy",
    description: "When you can cancel a GrovvIthUs project or service and how refunds work.",
    body: `Last updated: [date]

## Project services (web, software, app, design, video)
- **Before work starts:** full refund of the advance, less payment-gateway charges, if you cancel within [48] hours of paying and no work has begun.
- **After work starts:** the advance is non-refundable up to the value of work completed and costs already paid to third parties. Any unused balance is refunded within [10] working days.
- **After delivery or launch:** no refund for completed and accepted work. We fix defects free of charge for [30] days.
- **Custom software and apps:** milestone payments are non-refundable once the milestone is delivered for review.

## Monthly services (SEO, marketing, maintenance, social media)
- Billed monthly in advance. Cancel with [30] days' written notice; the current month is not refunded.
- Ad spend paid to Google, Meta or other platforms is not refundable by us.

## One-off creatives (logos, posters, edits)
- Not refundable after the first draft is delivered, because the work has been performed. Revisions are included as stated in your order.

## Domains, hosting, licences and plugins
- Non-refundable once purchased for you, subject to the provider's own policy.

## How to request
Email [email] with your invoice number and reason. We reply within [3] working days. Approved refunds go back to the original payment method within [7 to 10] working days.`,
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    description: "How the GrovvIthUs website uses cookies and similar storage.",
    body: `Last updated: [date]

Cookies and similar storage are small pieces of data kept in your browser. This is how our website uses them today.

## What we use now
- **Theme choice (local storage):** remembers whether you chose light or dark mode. It never leaves your device.
- **Security and sign-in (cookie, team only):** a secure session cookie is set only when our staff sign in to the admin panel. Visitors do not receive it.

We do not currently use advertising or analytics cookies on this website.

## If we add analytics or advertising
[Before enabling analytics or advertising tags (for example Google Analytics, Microsoft Clarity or Meta Pixel), list them here and add a consent banner that blocks them until you agree.]

## Your choices
You can delete or block cookies and local storage in your browser settings. The site works without them, but your theme choice will not be remembered.`,
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    description: "Important limits on the information and results described on the GrovvIthUs website.",
    body: `The information on this website is for general guidance and is provided "as is". Examples, statistics and case-study results show past work and do not guarantee similar results for you.

We do not guarantee search rankings, traffic, leads, sales, app-store approval or social media growth. Search engines, AI assistants and advertising platforms change often and make their own decisions.

External links are given for convenience, and we are not responsible for their content. Trademarks and brand names belong to their owners.

Nothing on this website is legal, tax or financial advice.`,
  },
];

export const getLegal = (slug: string) => LEGAL.find((d) => d.slug === slug);
export const hasPlaceholders = (body: string) => /\[[^\]]+\]/.test(body);
