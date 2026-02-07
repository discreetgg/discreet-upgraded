import { Separator } from "@/components/ui/separator";
import { Hero } from "../_components/hero";
import { PrivacyPolicySidebar } from "@/components/privacy-policy-sidebar";

// Array of all section headers in the privacy policy
const privacyPolicyHeaders = [
  "Introduction",
  "Information We Collect",
  "How We Use Your Information",
  "How We Share Your Information",
  "Data Retention",
  "Your Choices",
  "Cookies and Tracking Technologies",
  "Security",
  "International Transfers",
  "Children's Online Privacy",
  "Changes to This Privacy Policy",
  "Contact Us",
];

export default function Page() {
  return (
    <div className='bg-[#0f1114] min-h-screen text-[#b3b3b3] py-6 lg:py-12'>
      <div className='max-w-7xl mx-auto px-4 lg:px-6'>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Main content */}
          <div className="flex-1">
        {/* <div className='mb-8'>
          <h1 className='text-4xl font-bold text-[#b3b3b3] mb-2'>
            Privacy Policy
          </h1>
          <p className='text-[#737682] text-sm'>Last Updated: April 27, 2025</p>
        </div> */}
        <Hero type="privacy" lastUpdated="November 25, 2025" />
        <Separator />
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start relative">     
           <div className="flex-1 flex flex-col gap-y-4 items-start">
          <div className='space-y-4 lg:space-y-6 text-sm leading-relaxed py-8 lg:py-[100px] px-4 lg:px-6 justify-center max-w-7xl mx-auto '>
        <h1 id="introduction" className="text-3xl lg:text-[45px] font-bold mb-6 lg:mb-12 text-white">Introduction</h1>
          <p>
            This Privacy Policy (<span className="italic">“Policy”</span>) describes how Potion Labs LLC
            (<span className="italic">“Company,” “we,” “us,” or “our”</span>), operating the adult 18+ user-generated
            content and camming platform located at <span className="text-white font-medium">discreet.gg</span> (the
            <span className="italic">“Platform”</span>), collects, uses, maintains, protects, and discloses your
            personal data when you access or use the Platform.
          </p>

          <p>
            This Policy applies to personal data collected through the Platform
            regardless of your country of residence, including when you create
            an account via Discord OAuth, complete Ondato age verification or
            seller KYC, deposit funds to obtain credits, purchase menu items,
            unlock DM content, tip sellers, post or upload content, or
            participate in 1-on-1 camming sessions.
          </p>

          <p>
            By accessing or using the Platform, you accept and consent to the
            practices described in this Policy. If you do not agree with this
            Policy, you must not access or use the Platform.
          </p>

          <p>
            The Platform may include links or integrations to third-party
            websites, plug-ins, services, social networks, or applications.
            Interacting with these third parties may allow them to collect or
            share data about you. We do not control third-party websites or
            services, and you should review their privacy policies before
            engaging with them.
          </p>

          <p>
            We may update this Policy from time to time. Continued use of the
            Platform after updates indicates your acceptance of the revised
            terms, so please review this Privacy Policy periodically.
          </p>
          </div>
          <Separator />

          <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="information-we-collect" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              Information We Collect
            </h1>
            <p>
              “Personal data” means any information about an individual that can
              identify that person. It does not include anonymized data where
              the identity has been removed.
            </p>

            <div className=' space-y-12 '>
              <div className="space-y-4 ">
                <h3 className='font-medium text-[#ffffff] mb-2'>
                  Identity &amp; Contact Data
                </h3>
                <p className="space-y-2">
                  This includes your first and last name, username, stage name
                  (if applicable), Discord identifiers used for login, government-issued
                  photo identification, date of birth (for Ondato age verification),
                  seller KYC information, gender (if provided), tax information,
                  and any identifiable information contained within media you
                  upload, as well as your email address, telephone number (if
                  provided), and other contact information required for account or
                  compliance purposes.
                </p>
              </div>
              <Separator />
              <div className="gap-2 ">
                <h3 className='font-medium text-[#ffffff] mb-2'>
                  Financial &amp; Transaction Data
                </h3>
                <p>
                  We collect limited information needed to process deposits,
                  credits, spending, and payouts. Our third-party payment
                  processors may store and process your payment information.
                  Transaction data includes details of credit purchases, spending
                  of credits on menu items, DM unlocks, tips, feed content, per-minute
                  camming sessions, and payouts to sellers.
                </p>
              </div>
              <Separator />
              <div className="gap-2 ">
                <h3 className='font-medium text-[#ffffff] mb-2'>
                  Technical, Device, Usage &amp; Content Data
                </h3>
                <p>
                  We may collect Technical and Device Data such as IP address,
                  login data, browser type and version, time zone, device
                  information, operating system, and similar technical details
                  used to provide and secure the Platform.
                </p>
                <p>
                  Usage Data includes information about how you interact with the
                  Platform, including navigation, features used, and engagement
                  levels over time.
                </p>
                <p>
                  Content Data includes photos, videos, text posts, feed content,
                  DM messages, cam interactions, and any other user-generated
                  content you upload or transmit, which may include metadata and
                  personal data you choose to disclose.
                </p>
                <p>
                  Profile Data includes your username, preferences, purchase
                  history, interests, feedback, survey responses, and settings
                  (including some information that may be considered sensitive,
                  such as sexual content or sexual preferences you choose to
                  share). By submitting such data, you consent to its processing.
                </p>
              </div>
              <Separator />

              <div className="space-y-4 ">
                <h3 className='font-medium text-[#ffffff] mb-2'>
                  Information from Third Parties &amp; Aggregated Data
                </h3>
                <p className="space-y-2">
                  We may receive personal data from payment processors (regarding
                  deposits, credits, or payouts), compliance vendors such as
                  Ondato (for age verification and KYC), analytics and search
                  providers, hosting partners, or other service providers. We may
                  also create or use Aggregated Data (statistical or demographic
                  data) that is not considered personal data because it does not
                  identify you. If Aggregated Data is combined with personal data
                  in a way that identifies you, we treat it as personal data.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className='font-medium text-[#ffffff] mb-2'>
                  Special Categories of Personal Data
                </h3>
                <p>
                  We do not intentionally collect special categories of personal
                  data (such as information about your race or ethnicity,
                  religious or philosophical beliefs, political opinions,
                  trade-union membership, health, genetic or biometric data, or
                  criminal convictions), unless you voluntarily provide such
                  information through your use of the Platform.
                </p>
                <p>
                  Because the Platform involves adult 18+ user-generated content,
                  you may voluntarily submit information related to your sex life
                  or sexual orientation as part of Content Data. By choosing to
                  submit such information, you expressly consent to our
                  processing of that data.
                </p>
              </div>
            </div>
          </div>
          <Separator />

          <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="how-we-use-your-information" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              How We Use Your Information
            </h1>
            <p>
              We use your personal data to operate the Discreet Platform,
              provide services to buyers and sellers, maintain safety and
              compliance, communicate with you, process credit transactions, and
              improve your overall experience.
            </p>

            <div className='space-y-4'>
              <p>
                Provide, operate, and maintain the Platform, including menus,
                feed posts, DMs, locked content, tips, credits, and 1-on-1
                camming features.
              </p>
              <Separator />
              <p>
                Meet our contractual obligations, including processing credit
                deposits, spending, earnings, payouts, and enforcing our rights.
              </p>
              <Separator />
              <p>
                Verify your identity and age using Ondato age verification and,
                where required, perform seller KYC and other compliance checks.
              </p>
              <Separator />
              <p>
                Communicate with you about your account and the Platform,
                including transactional or service-related messages (for example,
                purchase confirmations or system notifications).
              </p>
              <Separator />
              <p>
                Monitor and analyze usage and trends to operate, secure, and
                improve the Platform, including via cookies and similar
                technologies.
              </p>
              <p>Enforce our Terms of Service and other legal agreements</p>
              <Separator />
              <p>
                Detect, prevent, and address fraud, abuse, illegal content,
                security breaches, or technical issues, and comply with legal and
                regulatory obligations (including 18+ age restrictions and safety
                rules).
              </p>
            </div>
          </div>

          <Separator />

          <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full '>
            <h2 className='text-2xl lg:text-3xl font-semibold text-white'>
              How We Collect Data About You
            </h2>
            <p>
              We collect personal data about you through a combination of direct
              interactions, your contributions on the Platform, automated
              technologies, and information from third parties.
            </p>
            <div className='space-y-4'>
              <div>
                <h3 className='font-medium text-[#ffffff] mb-1'>
                  1. Direct Interactions
                </h3>
                <p>
                  You may provide data directly when you create an account via
                  Discord OAuth, complete Ondato age verification or seller KYC,
                  deposit funds to obtain credits, create a seller profile or
                  menu, post on your feed, send DM content, use 1-on-1 camming
                  features, request marketing communications, submit feedback,
                  fill out surveys, report content, or contact support.
                </p>
              </div>
              <div>
                <h3 className='font-medium text-[#ffffff] mb-1'>
                  2. User Contributions and Transmissions
                </h3>
                <p>
                  You may provide Content Data for posting on public or
                  semi-public areas of the Platform (such as seller feed posts)
                  or for transmission to other users (such as DMs or locked
                  content sent to buyers). You share Content Data at your own
                  risk; while we moderate for compliance (including 18+ rules and
                  illegal content restrictions), we cannot control how buyers,
                  sellers, or third parties may view, copy, or distribute your
                  content.
                </p>
              </div>
              <div>
                <h3 className='font-medium text-[#ffffff] mb-1'>
                  3. Automated Technologies or Interactions
                </h3>
                <p>
                  As you interact with the Platform, we may automatically collect
                  Technical, Device, and Usage Data using cookies, server logs,
                  browser or device identifiers, and other tracking technologies,
                  including behavioral data regarding your usage across time. The
                  Platform does not respond to browser Do Not Track (<span className="italic">“DNT”</span>)
                  signals.
                </p>
              </div>
              <div>
                <h3 className='font-medium text-[#ffffff] mb-1'>
                  4. Third Parties or Public Sources
                </h3>
                <p>
                  We may receive personal data about you from third parties,
                  including payment processors (regarding deposits, credits, or
                  payouts), compliance vendors such as Ondato (age verification,
                  KYC), technical or hosting partners, analytics and search
                  providers, and other service partners.
                </p>
              </div>
            </div>
          </div>

          <Separator />

            <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="how-we-share-your-information" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              How We Share Your Information
            </h1>
            <p className="mb-4">
              We may share your personal data in the following circumstances:
            </p>

            <div className='space-y-4'>
              <p className="">
               <span className="font-medium text-white">With Service Providers:</span> To help us operate and support the
                Platform (for example, payment processors, compliance and KYC
                vendors such as Ondato, hosting providers, analytics providers,
                and customer support tools).
              </p>
              <Separator />
              <p className="">
               <span className="font-medium text-white">For Legal Compliance:</span> To comply with laws, regulations, legal
                processes, lawful requests from authorities, or enforceable
                governmental demands, including obligations relating to age
                verification, KYC, fraud prevention, or safety.
              </p>
              <Separator />
              <p className="">
               <span className="font-medium text-white">To Protect Rights:</span> To protect the rights, property, or safety of
                the Company, our users, or the public, including investigating
                and responding to potential violations of our Terms or policies.
              </p>
              <Separator />
              <p className="">
               <span className="font-medium text-white">In Business Transfers:</span> In connection with any merger, sale of
                company assets, financing, or acquisition of all or a portion of
                our business, in which case personal data may be transferred as
                part of the transaction.
              </p>
                <Separator />
          
              <p className="">
               <span className="font-medium text-white">We do not sell or rent your personal information to third
                parties for their independent marketing purposes.</span>
              </p>
            </div>
          </div>
          <Separator />

          <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="data-retention" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              Data Retention
            </h1>
            <p>
              Except where a longer retention period is required or permitted by
              law, we retain your personal data only for as long as necessary to
              fulfill the purposes for which it was collected, including
              complying with legal, accounting, verification, and regulatory
              requirements (such as 18+ age checks, Ondato KYC records for
              sellers, fraud-prevention documentation, and Platform safety
              records).
            </p>
            <p>
              In some cases, we may anonymize your personal data so that it can
              no longer be associated with you. We may use anonymized or
              de-identified data for any legitimate business purpose without
              further notice or consent.
            </p>
            <p>
              In cases where the law or our internal compliance requirements
              require certain personal data (for example, age verification or
              seller KYC), failure to provide such data may prevent us from
              offering you access to the Platform or to specific features. If we
              must restrict or terminate your access due to missing required
              data, we may notify you at the time such action is taken.
            </p>
          </div>
          <Separator />

          <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="your-choices" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              Your Choices
            </h1>
            <p>
              <span className="font-medium text-white">Account Information &amp; Access Rights:</span> You may access,
              review, or edit certain personal data directly in your account
              settings on the Platform. You can also request access, correction,
              or deletion of personal data by emailing{" "}
              <span className="text-[#00b328]">privacy@discreet.gg</span>. We may
              not be able to delete some information where retention is required
              by law or necessary for compliance.
            </p>
              <p className="">
              <span className="font-medium text-white">Cookies:</span> Most browsers allow you to control or disable cookies.
              However, disabling cookies may affect your ability to use the
              Platform.
            </p>
            <p>
              <span className="font-medium text-white">Withdrawing Consent:</span> Where our processing of your personal data
              is based on consent, you may withdraw that consent in accordance
              with applicable law by contacting{" "}
              <span className="text-[#00b328]">privacy@discreet.gg</span>.
              Withdrawing consent may limit our ability to provide certain
              features or services, and we will explain any consequences at the
              time of your request.
            </p>
            <div className='space-y-3 pt-4'>
              <h3 className='font-medium text-white'>
                Your California Privacy Rights
              </h3>
              <p>
                Under California law, California residents may request
                information about how we disclose personal data to third parties
                for their direct marketing purposes. To make such a request,
                contact{" "}
                <span className="text-[#00b328]">privacy@discreet.gg</span>.
              </p>
              <h3 className='font-medium text-white'>
                Special Terms for EEA/UK Residents
              </h3>
              <p>
                If you reside in the European Economic Area (EEA) or the United
                Kingdom (UK), we may process your personal data where necessary
                for contract performance, based on your consent, to comply with
                legal obligations, or for our legitimate interests (for example,
                security, fraud prevention, and operating the Platform) where
                such interests are not overridden by your rights.
              </p>
              <p>
                Subject to applicable law and certain limitations, you may have
                additional rights, including: (1) the right of access, (2) the
                right to correct inaccurate or incomplete data, (3) the right to
                request erasure where there is no longer a valid reason for us
                to retain it, (4) the right to object to certain processing,
                including direct marketing, (5) the right to request restriction
                of processing in certain circumstances, (6) the right to data
                portability for data you provided to us where processing is
                based on consent or contract and carried out by automated means,
                and (7) the right to withdraw consent at any time without
                affecting the lawfulness of processing carried out before
                withdrawal.
              </p>
              <p>
                We will not normally charge a fee for exercising these rights,
                but we may charge a reasonable fee or refuse to act on a request
                if it is unfounded, repetitive, or excessive. To protect your
                privacy, we may request additional information to verify your
                identity and may ask for clarification to help us respond. We
                aim to respond to all valid requests within one month, or
                within any longer period permitted by applicable law for complex
                or multiple requests.
              </p>
            </div>
          </div>

          <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="cookies-and-tracking-technologies" className='text-[45px] font-semibold text-[#ffffff] mt-8 mb-4'>
              Cookies and Tracking Technologies
            </h1>
            <p>We use cookies and similar technologies to:</p>

            <div className=' space-y-2'>
              <p className="flex flex-col gap-2"><span className="text-white font-semibold">01</span>Authenticate users</p>
              <Separator/>
              <p className="flex flex-col gap-2"><span className="text-white font-semibold">02</span>Remember user preferences</p>
              <Separator/>
              <p className="flex flex-col gap-2"><span className="text-white font-semibold">03</span>Analyze usage of the Platform</p>
              <Separator/>
              <p className="flex flex-col gap-2"><span className="text-white font-semibold">04</span>Improve security</p>
              <Separator/>
            </div>

            <p className="">
              We and certain third parties may also use web beacons, pixel tags,
              or similar technologies to measure traffic, content performance,
              and system integrity across the Platform. You can control or
              disable cookies through your browser settings, but some features of
              the Platform may not function properly if cookies are disabled.
            </p>
            <p>
              The Platform does not respond to browser Do Not Track (<span className="italic">“DNT”</span>)
              signals, as there is currently no industry-wide standard for DNT
              compliance.
            </p>
            <p>
              Some content, applications, analytics, or advertising features on
              the Platform may be served by third parties. These third parties
              may use cookies, web beacons, or similar tracking technologies to
              collect information about your activity on the Platform and across
              other sites or services, including to deliver personalized content
              or advertising. We do not control how these third-party
              technologies operate or how the collected data is used, and their
              practices are governed by their own privacy policies.
            </p>
          </div>
          <Separator />
          <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="security" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              Security
            </h1>
            <p className="">
              We implement reasonable administrative, technical, and physical
              safeguards to protect your information.
            </p>
            <p>
              However, no method of transmitting information over the Internet or
              method of electronic storage is completely secure. We cannot
              guarantee the absolute security of your personal data, and any
              transmission is at your own risk.
            </p>
            <p>
              Security also depends on you. If you create or are provided with
              login credentials for access to the Platform, you are responsible
              for keeping your credentials confidential and for restricting
              access to your devices. Use caution when posting or interacting in
              any public-facing areas of the Platform, as information you share
              publicly can be viewed, copied, or captured by other users.
            </p>
          </div>
          <Separator />
          <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="international-transfers" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              International Transfers
            </h1>
            <p>
              Your personal data may be transferred to, and maintained on,
              servers located outside of your state, province, country, or other
              governmental jurisdiction, including where our hosting providers,
              service partners, or affiliates are based.
            </p>
            <p>
              By using the Platform, you consent to the transfer of information
              to countries outside of your country of residence, where data
              protection laws may be different from those in your jurisdiction,
              as necessary to provide the Platform and comply with applicable
              legal requirements.
            </p>
          </div>
          <Separator />
          <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="childrens-privacy" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              Children&apos;s Online Privacy
            </h1>
            <p className="">
              Discreet is strictly for adults 18 years and older and is not
              directed to minors.
            </p>
            <p>
              We do not knowingly collect personal data from anyone under 18. If
              we learn that personal data belonging to a minor has been
              collected, we will delete it promptly. If you believe a minor&apos;s
              data was provided to us in error, please contact us at{" "}
              <span className="text-[#00b328]">privacy@discreet.gg</span>.
            </p>
          </div>
          <Separator />

          <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full '>
            <h1 id="changes-to-this-privacy-policy" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              Changes to This Privacy Policy
            </h1>
            <p>We may update this Privacy Policy from time to time.</p>
            <p>
              We will post any updates or changes to this Privacy Policy on this
              page. If we make material changes to how we process or protect
              your personal data, we may notify you by sending an email to the
              address associated with your account or by displaying a prominent
              notice on the Platform. Your continued use of the Platform after
              changes indicates your acceptance of the updated Policy.
            </p>
          </div>

          <Separator />

          <div className='flex flex-col gap-y-4 py-8 lg:py-[100px] px-4 lg:px-6  max-w-7xl mx-auto w-full text-center '>
            <h1 id="contact-us" className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'>
              Contact Us
            </h1>
            <p>
              If you have any questions about this Privacy Policy or our
              privacy practices, or if you wish to exercise any data protection
              rights, please contact us at:
            </p>
            <p className='text-[#00b328]'>Email: privacy@discreet.gg</p>
          </div>

          </div>
            {/* Sidebar */}
            <div className="w-84 hidden lg:block flex-shrink-0 h-dvh max-h-[1000px] sticky top-0">
              <PrivacyPolicySidebar headers={privacyPolicyHeaders} />
            </div>
          </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
