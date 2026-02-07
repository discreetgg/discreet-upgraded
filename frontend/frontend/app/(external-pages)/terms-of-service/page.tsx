import { Separator } from "@/components/ui/separator";
import { Hero } from "../_components/hero";
import { TermsOfServiceSidebar } from "@/components/terms-of-service-sidebar";

// Array of all section headers in the terms of service
const termsOfServiceHeaders = [
  "Introduction",
  "Adult Content and Eligibility",
  "Accessing the Platform & Accounts",
  "Credits, Transactions, and Earnings",
  "User Content and Prohibited Conduct",
  "Safety; CSAM, Prostitution & Trafficking",
  "Intellectual Property & DMCA",
  "Privacy and Communications",
  "Disclaimers and Liability Limits",
  "Dispute Resolution and Arbitration",
  "Changes, Notices, and General Terms",
  "California Consumer Information",
  "Contact and Abuse Reporting",
];

export default function Page() {
  return (
    <div className='bg-[#0f1114] min-h-screen text-[#b3b3b3] py-6 lg:py-12'>
      <div className='max-w-7xl mx-auto px-4 lg:px-6'>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <div className="flex-1">
            <Hero type="terms" lastUpdated="November 25, 2025" />

            <Separator />

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start relative">     
              <div className="flex-1 flex flex-col gap-y-4 items-start">
                <div className='space-y-4 lg:space-y-6 text-sm leading-relaxed py-8 lg:py-[100px] px-4 lg:px-6 justify-center max-w-7xl mx-auto '>
            <h1 id="introduction" className="text-3xl lg:text-[45px] font-bold mb-6 lg:mb-12 text-white">Introduction</h1>
              <p>
                These Terms of Service (<span className="italic">"Terms"</span>) form a legally binding
                agreement between you (<span className="italic">"you"</span> or the <span className="italic">"User"</span>) and Potion Labs LLC,
                a Wyoming limited liability company (<span className="italic">"Discreet," "Company," "we," "us,"</span> or
                <span className="italic">"our"</span>), which owns and operates the adult 18+ platform located at{" "}
                <span className="text-white font-medium">discreet.gg</span> and its related features, integrations, and
                services (collectively, the <span className="italic">"Platform"</span>).
              </p>
              <p>
                These Terms govern your access to and use of the Platform, including all
                content, functionality, buyer-to-seller interactions, credit-based
                transactions, and services offered through it. By accessing or using the
                Platform, you acknowledge that you have read, understand, and agree to be
                bound by these Terms.
              </p>
              <p className="font-semibold text-white">
                BY ACCESSING OR USING THE PLATFORM, YOU AGREE TO THESE TERMS. IF YOU DO NOT
                AGREE, YOU MUST NOT ACCESS OR USE THE PLATFORM.
              </p>
              <p className="font-semibold text-white">
                THIS AGREEMENT REQUIRES THE USE OF ARBITRATION ON AN INDIVIDUAL BASIS TO
                RESOLVE DISPUTES, RATHER THAN JURY TRIALS OR CLASS ACTIONS.
              </p>
              <p>
                If you have questions about these Terms or the Platform, you may contact us
                at <span className="text-[#00b328]">legal@discreet.gg</span>.
              </p>
              </div>
              <Separator />

              <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="adult-content-and-eligibility" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Adult-Oriented Content; Eligibility
                </h1>
                <p>
                  Discreet is an adult digital platform that provides access to 18+ user-generated
                  content and interactive features offered by independent third-party sellers,
                  including menus, unlockable DM content, feed posts, tips, and 1-on-1 camming
                  billed per minute. By accessing the Platform, you will be exposed to uncensored,
                  explicit adult material, including graphic depictions, nudity, adult language,
                  and descriptions of sexually explicit activity involving consenting adults
                  (including heterosexual, bisexual, homosexual, and transgender contexts).
                </p>
                <p>
                  Only individuals who are at least 18 years old, who have reached the age of
                  majority in their jurisdiction, and who have successfully completed Ondato age
                  verification may access the Platform. If you do not meet these requirements, you
                  must not use the Platform and must immediately discontinue access.
                </p>
                <p>
                  By accessing the Platform, you affirm that: (1) you are at least 18 years old and
                  have the legal capacity to enter into this agreement; (2) you understand and
                  accept the adult nature of the Platform; (3) you comply with local laws regarding
                  access to adult materials; (4) you have the legal right to access adult content
                  and Discreet has the legal right to transmit it to you; (5) you are requesting
                  adult content for your own personal and private use; (6) you are not accessing the
                  Platform from any location where such access is unlawful; and (7) you will not
                  share adult materials from the Platform with any minor or make such content
                  accessible to any minor.
                </p>
                <p className="font-semibold text-white">
                  The Platform strictly prohibits anyone who does not meet these age and eligibility
                  requirements from accessing or using the Platform. All users must pass Ondato age
                  verification to access the Platform.
                </p>
              </div>
              <Separator />

              <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="accessing-the-platform-accounts" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Accessing the Platform &amp; Accounts
                </h1>
                <p>
                  We may withdraw, modify, or limit access to any part of the Platform—including
                  features, services, content, menus, messages, feed posts, camming, or seller
                  tools—at our sole discretion and without notice. We are not liable for any
                  unavailability of the Platform or any portion of it at any time.
                </p>
                <p>
                  You are responsible for making all arrangements necessary to access the Platform,
                  including maintaining your Discord account for OAuth login and any equipment,
                  connectivity, or services required to view adult content.
                </p>
                <div className='space-y-6'>
                  <div>
                    <h3 className='font-medium text-white mb-2'>Account Creation</h3>
                    <p>
                      To access many features of the Platform, you must create an account using
                      Discord OAuth. Registration is free and for individual use only. During
                      registration, you must provide accurate information as prompted and all users
                      must pass Ondato age verification before accessing adult content.
                    </p>
                    <p>
                      Your username and any display name must not be offensive, misleading, or
                      infringe on any service mark, trademark, or trade name. We may delete or
                      require you to change any username or display name that violates this
                      requirement.
                    </p>
                  </div>
                  <div>
                    <h3 className='font-medium text-white mb-2'>Responsibility for Your Account</h3>
                    <p>
                      You are responsible for maintaining the confidentiality and security of your
                      account credentials, including your Discord login and any other authentication
                      methods used to access the Platform. You are responsible for all actions taken
                      on your account, whether authorized by you or not.
                    </p>
                    <p>
                      If you suspect unauthorized access or any security breach, you must promptly
                      notify us at{" "}
                      <span className="text-[#00b328]">support@discreet.gg</span>.
                    </p>
                  </div>
                </div>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="credits-transactions-and-earnings" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Credits, Transactions, and Earnings
                </h1>
                <p>
                  Accessing and registering for the Platform is free. Buyers only provide payment
                  information when depositing funds to receive credits for use on the Platform.
                  Credits may be used to purchase menu items, unlock content, tip sellers, and pay
                  for camming sessions.
                </p>
                <div className='space-y-4'>
                  <div className="space-y-2">
                    <h3 className='font-medium text-[#ffffff] mb-1'>Credits and Purchases</h3>
                    <p>
                      Credits are a virtual balance used solely within the Platform. Deposits and
                      credit purchases are processed by third-party payment providers. Except where
                      required by law or expressly stated otherwise, all purchases are final and
                      non-refundable.
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className='font-medium text-[#ffffff] mb-1'>Seller Earnings and Payouts</h3>
                    <p>
                      Independent sellers earn a share of the credits spent on their menus, posts,
                      DM unlocks, tips, and camming sessions, as displayed in the Platform or
                      applicable seller documentation. We may deduct platform fees or payment
                      processing costs as disclosed to sellers.
                    </p>
                    <p>
                      Payouts to sellers are handled through third-party providers and may require
                      completion of Ondato KYC or other verification. We reserve the right to delay,
                      withhold, or reverse payouts where we reasonably suspect fraud, chargebacks,
                      violations of these Terms, or legal or compliance issues.
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className='font-medium text-[#ffffff] mb-1'>Message and Data Rates</h3>
                    <p>
                      You are solely responsible for any message, data, or connectivity charges that
                      may apply when accessing or using the Platform, including any phone, SMS, or
                      MMS communications you may choose to engage in. These charges are billed by and
                      payable to your internet or mobile service provider.
                    </p>
                  </div>
                </div>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="user-content-and-prohibited-conduct" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  User Content and Prohibited Conduct
                </h1>
                <p>
                  The Platform enables independent sellers to offer menus, send or unlock DM
                  content, post on feeds, and participate in 1-on-1 camming sessions. Buyers may
                  interact with this content and with sellers through various interactive tools.
                </p>
                <div className='space-y-4'>
                  <div className="space-y-2">
                    <h3 className='font-medium text-[#ffffff] mb-1'>User-Generated Content</h3>
                    <p>
                      “User Content” includes any photos, videos, audio, text, live streams, DMs,
                      cam interactions, or other materials you upload or transmit via the Platform.
                      You retain ownership of your User Content, but you grant Discreet a
                      worldwide, non-exclusive, royalty-free, sublicensable, and transferable
                      license to host, store, use, reproduce, adapt, publish, translate, create
                      derivative works from, distribute, publicly perform, and publicly display
                      such User Content as necessary to operate, promote, and improve the Platform
                      and to comply with legal, safety, and moderation obligations.
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className='font-medium text-[#ffffff] mb-1'>Code of Conduct</h3>
                    <p>
                      You may not use the Platform to engage in illegal activity, harassment, hate
                      speech, threats, doxxing, non-consensual sharing of content, fraud, or any
                      conduct that violates another person’s privacy, safety, or rights. You agree
                      to comply with all applicable laws and Discreet’s content standards and
                      community rules as may be posted on the Platform.
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className='font-medium text-[#ffffff] mb-1'>Content Moderation and Monitoring</h3>
                    <p>
                      We may, but are not required to, monitor, review, or pre-screen User Content
                      and communications (including DMs and cam interactions) for compliance,
                      safety, and legal reasons. We reserve the right to remove or restrict any
                      content or account at our sole discretion, including where we believe
                      behavior or content violates these Terms, our content standards, or
                      applicable law.
                    </p>
                  </div>
                </div>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="safety-csam-prostitution-trafficking" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Safety; CSAM, Prostitution &amp; Trafficking
                </h1>
                <div className='space-y-4'>
                  <div>
                    <h3 className='font-medium text-white mb-2'>
                      Child Sexual Abuse Material Strictly Prohibited
                    </h3>
                    <p>
                      Discreet enforces an absolute ban on any content involving minors. Only
                      consenting adults age 18+ who have passed Ondato age verification may access
                      or appear on the Platform. We prohibit any real or simulated visual media
                      depicting minors engaged in sexual activity or any content that is
                      exploitative of children.
                    </p>
                    <p>
                      If you encounter any such material on the Platform, please report it
                      immediately to{" "}
                      <span className="text-[#00b328]">compliance@discreet.gg</span> with all
                      relevant information (including date, time, and supporting details). We will
                      promptly investigate, remove any prohibited content, and cooperate fully with
                      law enforcement.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className='font-medium text-white mb-2'>
                      Prostitution and Sex Trafficking Prohibited
                    </h3>
                    <p>
                      You may not use the Platform—including buyer-seller messaging, menus, feed
                      posts, unlockable content, tips, or 1-on-1 cam sessions—to engage in, support,
                      promote, request, facilitate, or arrange prostitution or sex trafficking of
                      any person. This includes using the Platform to share personal contact details
                      or arrange in-person meetings of any kind.
                    </p>
                    <p>
                      If you see any evidence of prostitution or sex trafficking on the Platform,
                      report it immediately to{" "}
                      <span className="text-[#00b328]">compliance@discreet.gg</span> with all
                      available evidence. We may immediately terminate accounts and report suspected
                      activity to appropriate law enforcement authorities.
                    </p>
                  </div>
                </div>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="intellectual-property-dmca" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Intellectual Property &amp; DMCA
                </h1>
                <div className='space-y-4'>
                  <div>
                    <h3 className='font-medium text-white mb-2'>Platform Content</h3>
                    <p>
                      Except for User Content, all content on the Platform—including text,
                      graphics, logos, icons, images, audio clips, digital downloads, and
                      software—is owned by Discreet or its licensors and is protected by
                      copyright, trademark, and other intellectual property laws. You receive only
                      a limited, non-exclusive, non-transferable license to access and use the
                      Platform for your personal, lawful use.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className='font-medium text-white mb-2'>DMCA and Copyright Policy</h3>
                    <p>
                      We respect the intellectual property rights of others and respond to notices
                      of alleged copyright infringement that comply with applicable law. If you
                      believe your copyrighted work has been used on the Platform in a way that
                      constitutes infringement, you must contact our designated copyright agent as
                      described in our copyright policy, providing all information required under
                      applicable law.
                    </p>
                    <p>
                      All notices of alleged copyright infringement should be sent using the
                      methods stated in our copyright policy. Misuse of the DMCA process may result
                      in legal consequences.
                    </p>
                  </div>
                </div>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="privacy-and-communications" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Privacy and Communications
                </h1>
                <p>
                  Your use of the Platform is also governed by Discreet&apos;s Privacy Policy,
                  which describes how we collect, use, store, and disclose personal data when you
                  access or use the Platform. By using the Platform, you acknowledge that you have
                  read and understood the Privacy Policy and consent to the processing of your
                  information as described there.
                </p>
                <p>
                  Discreet does not provide facilities for confidential communications. All
                  messages transmitted on or through the Platform—including DMs, menu interactions,
                  unlockable content, requests, and communications conducted via Discord OAuth
                  integration—may be monitored, logged, or reviewed by Platform staff, moderators,
                  or automated systems for moderation, safety, security, and operational purposes.
                  You must not use the Platform for communications that you intend to be viewable
                  solely by specific named recipients.
                </p>
                <p>
                  We may monitor, log, and record communications conducted through the Platform’s
                  interactive features, including text chats, DMs, menu interactions, camming
                  session metadata, uploaded media, streaming or live communication events, and
                  other similar interactions. Recorded or logged communication data may be used for
                  compliance, moderation, security, fraud prevention, analytics, quality
                  assurance, platform improvement, and, unless you opt out, certain promotional or
                  marketing purposes.
                </p>
                <p>
                  You may opt out of Discreet using recorded communications for marketing purposes
                  by emailing <span className="text-[#00b328]">privacy@discreet.gg</span> with the
                  subject line “Recording Opt-Out.” This opt-out does not apply to moderation,
                  legal, or security uses, which may continue as required.
                </p>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="disclaimers-and-liability" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Disclaimers, Limitation of Liability &amp; Indemnity
                </h1>
                <p className="font-semibold text-white">
                  THE PLATFORM, INCLUDING ALL CONTENT AND SERVICES, IS PROVIDED ON AN "AS IS" AND
                  "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
                  IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, DISCREET DISCLAIMS ALL
                  WARRANTIES, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                  PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                </p>
                <p className="font-semibold text-white">
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL DISCREET OR
                  ITS OWNERS, DIRECTORS, OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING
                  DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, ARISING
                  OUT OF OR IN CONNECTION WITH YOUR USE OF, OR INABILITY TO USE, THE PLATFORM.
                </p>
                <p className="font-semibold text-white">
                  TO THE EXTENT PERMITTED BY LAW, DISCREET&apos;S TOTAL AGGREGATE LIABILITY FOR ALL
                  CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM WILL NOT EXCEED
                  THE GREATER OF: (A) THE AMOUNTS YOU PAID TO DISCREET (IF ANY) IN THE 12 MONTHS
                  PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS
                  (US$100).
                </p>
                <p>
                  You agree to indemnify, defend, and hold harmless Discreet and its officers,
                  directors, employees, agents, affiliates, and service providers from and against
                  any claims, liabilities, damages, losses, costs, expenses, and fees (including
                  reasonable attorneys&apos; fees) arising out of or relating to: (1) your use of
                  the Platform; (2) your User Content; (3) your violation of these Terms; or (4)
                  your violation of any rights of another person or entity.
                </p>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="dispute-resolution-and-arbitration" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Dispute Resolution and Arbitration
          </h1>
                <p>
                  These Terms, and any dispute arising out of or relating to them or to the
                  Platform, are governed by the internal laws of the State of Wyoming, without
                  regard to its conflict-of-law principles, except to the extent that applicable
                  law in your jurisdiction requires otherwise.
                </p>
                <p>
                  You and Discreet agree that, except where prohibited by law, any dispute,
                  claim, or controversy arising out of or relating to these Terms or the
                  Platform will be resolved by binding arbitration on an individual basis, and
                  not by a jury trial or in a class, collective, or representative proceeding.
                </p>
                <p className="font-semibold text-white">
                  YOU AND DISCREET AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN
                  YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY
                  PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE ACTION.
                </p>
                <p>
                  Nothing in this section prevents either party from seeking injunctive or
                  equitable relief in court with respect to data security, intellectual
                  property, or unauthorized access to the Platform.
                </p>
                <p>
                  Any claim arising out of or related to the Platform or these Terms must be
                  filed within one (1) year after the cause of action accrues; otherwise, that
                  claim is permanently barred.
                </p>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
                <h1 id="changes-notices-general-terms" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Changes, Notices, and General Terms
                </h1>
                <p>
                  We may update or modify these Terms from time to time. The "Last Updated" date
                  at the top of the Terms indicates when changes were last made. Changes become
                  effective on that date and do not apply retroactively to disputes arising
                  before the change. Your continued use of the Platform after the updated Terms
                  are posted constitutes your acceptance of the revised Terms.
                </p>
                <p>
                  Discreet may provide notices to you electronically, including by email sent to
                  the most recent email address linked to your account or Discord identity, or
                  by posting a notice in a designated area of the Platform. You are responsible
                  for ensuring that your email address is current and for regularly checking the
                  Platform for notices and updates.
                </p>
                <p>
                  These Terms, together with any additional terms or policies referenced on the
                  Platform (including the Privacy Policy and content standards), constitute the
                  entire agreement between you and Discreet regarding your use of the Platform.
                  If any provision is found to be invalid or unenforceable, the remaining
                  provisions remain in full force and effect. Our failure to enforce any
                  provision is not a waiver of our right to do so later.
                </p>
                <p>
                  Nothing in these Terms creates a partnership, joint venture, agency, or
                  employment relationship between you and Discreet. You may not assign your
                  rights or obligations under these Terms without our prior written consent.
                  Discreet may assign these Terms in connection with a merger, acquisition,
                  corporate reorganization, or sale of assets.
                </p>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full '>
                <h1 id="california-consumer-information" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  California Consumer Information
                </h1>
                <p>
                  This section applies only to California residents, in compliance with
                  California Civil Code § 1789. The Platform is operated by Potion Labs LLC,
                  30 N Gould St Ste N, Sheridan, Wyoming 82801.
                </p>
                <p>
                  Registration for the Platform is free. Buyers are charged only when
                  purchasing credits, which may be used to obtain menu items, unlock content,
                  tip sellers, or pay for 1-on-1 camming sessions.
                </p>
                <p>
                  California residents may contact the Complaint Assistance Unit of the
                  Division of Consumer Services of the California Department of Consumer
                  Affairs at 1020 North Street, #501, Sacramento, California 95814, or by
                  telephone at +1 (916) 445-1254.
                </p>
              </div>
              <Separator />

              <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full text-center '>
                <h1 id="contact-and-abuse-reporting" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
                  Contact and Abuse Reporting
                </h1>
                <p>
                  The Platform is operated by Potion Labs LLC, 30 N Gould St Ste N, Sheridan,
                  Wyoming 82801.
                </p>
                <p>
                  For general support, billing questions, or technical issues, contact us at{" "}
                  <span className='text-[#00b328]'>support@discreet.gg</span> or via our support
                  portal at <span className='text-[#00b328]'>https://www.discreet.gg/support</span>.
                </p>
                <p>
                  For legal notices, contact{" "}
                  <span className='text-[#00b328]'>legal@discreet.gg</span>. For abuse reports,
                  including any suspected child sexual abuse material (CSAM) or involvement of
                  minors, contact{" "}
                  <span className='text-[#00b328]'>compliance@discreet.gg</span>. Discreet
                  investigates all such reports and cooperates with law enforcement.
                </p>
                </div>

              </div>
              
              {/* Sidebar */}
              <div className="w-84 hidden lg:block flex-shrink-0 h-dvh max-h-[1000px] sticky top-0">
                <TermsOfServiceSidebar headers={termsOfServiceHeaders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
