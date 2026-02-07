import { Separator } from "@/components/ui/separator";
import { Hero } from "../_components/hero";
import { PrivacyPolicySidebar } from "@/components/privacy-policy-sidebar";

const californiaPrivacyHeaders = [
  "Overview",
  "Information We Collect",
  "Use of Personal Information",
  "Sharing Personal Information",
  "Your CCPA Rights",
  "How to Exercise Your Rights",
  "Non-Discrimination",
  "Other California Privacy Rights",
  "Contact Information",
];

export default function Page() {
  return (
    <div className='bg-[#0f1114] min-h-screen text-[#b3b3b3] py-6 lg:py-12'>
      <div className='max-w-7xl mx-auto px-4 lg:px-6'>
        <div className='flex flex-col lg:flex-row gap-4 lg:gap-8'>
          {/* Main content */}
          <div className='flex-1'>
            <Hero type='California Privacy Policy' lastUpdated='November 25, 2025' />
            <Separator />

            <div className='flex flex-col lg:flex-row gap-4 lg:gap-8 items-start relative'>
              <div className='flex-1 flex flex-col gap-y-4 items-start'>
                <div className='space-y-4 lg:space-y-6 text-sm leading-relaxed py-8 lg:py-[100px] px-4 lg:px-6 justify-center max-w-7xl mx-auto'>
                  <h1
                    id='overview'
                    className='text-3xl lg:text-[45px] font-bold mb-6 lg:mb-12 text-white'
                  >
                    Privacy Policy for California Residents
                  </h1>
                  <p>
                    This Privacy Policy for California Residents supplements Discreet&apos;s
                    primary Privacy Policy and applies solely to visitors, buyers, and sellers who
                    reside in the State of California (<span className='italic'>“consumers”</span>{" "}
                    or <span className='italic'>“you”</span>). It is adopted to comply with the
                    California Consumer Privacy Act (<span className='italic'>“CCPA”</span>).
                    Terms defined in the CCPA carry the same meaning when used in this Policy.
                  </p>
                  <p>
                    Discreet collects information that identifies, relates to, describes,
                    references, is reasonably capable of being associated with, or could
                    reasonably be linked, directly or indirectly, with a particular consumer,
                    household, or device (<span className='italic'>“personal information”</span>).
                    Personal information does not include publicly available information from
                    government records, deidentified or aggregated information, or information
                    excluded from the CCPA&apos;s scope (such as certain health, financial, or
                    education records covered by other laws).
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='information-we-collect'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Information We Collect
                  </h1>
                  <p>
                    In the last 12 months, Discreet has collected the following categories of
                    personal information from California consumers, in connection with Discord
                    OAuth login, Ondato age verification and seller KYC, credits purchases and
                    payouts, platform security, and normal platform functionality:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>A</span>
                      <span>
                        <span className='font-semibold text-white'>Identifiers:</span> Real name,
                        alias, postal address, online identifier, IP address, email address,
                        account name, and government ID numbers used for age verification and
                        seller KYC.
                      </span>
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>B</span>
                      <span>
                        <span className='font-semibold text-white'>
                          California customer records:
                        </span>{" "}
                        Name, signature, physical description, address, telephone number, and
                        certain financial information necessary for credits deposits or payouts
                        (excluding full bank or card numbers unless required by payment
                        processors).
                      </span>
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>C</span>
                      <span>
                        <span className='font-semibold text-white'>Protected characteristics:</span>{" "}
                        Age (18+ required), and gender or gender identity if voluntarily provided.
                      </span>
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>D</span>
                      <span>
                        <span className='font-semibold text-white'>Commercial information:</span>{" "}
                        Records of credits purchased, spending activity (menus, tips, unlocks,
                        camming minutes), and other transactional history.
                      </span>
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>F</span>
                      <span>
                        <span className='font-semibold text-white'>
                          Internet or network activity:
                        </span>{" "}
                        Browsing history, search history, and interaction data with Discreet&apos;s
                        website, feed, menus, content, and messaging features.
                      </span>
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>H</span>
                      <span>
                        <span className='font-semibold text-white'>Sensory data:</span> Audio,
                        electronic, or visual data submitted by sellers as content or transmitted
                        during camming sessions.
                      </span>
                    </p>
                  </div>
                  <p>
                    Discreet does <span className='font-semibold text-white'>not</span> collect
                    biometric identifiers (E), precise geolocation data (G), professional or
                    employment-related information (I), non-public education information (J), or
                    inferences drawn to create consumer profiles (K), as defined in the CCPA.
                  </p>
                  <p className='mt-4'>
                    We collect personal information directly from you (for example, when you
                    create an account, complete Ondato verification, purchase credits, use DMs or
                    camming, or fill out forms), indirectly from you (through interactions with
                    the platform, such as browsing and messaging), and from third parties
                    (including Ondato, Discord OAuth, payment processors, and technical service
                    providers).
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='use-of-personal-information'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Use of Personal Information
                  </h1>
                  <p>
                    Discreet may use or disclose the personal information described above for the
                    following business purposes:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      To fulfill the reason for which the information was provided, including
                      processing age verification, KYC, credit deposits, menu purchases, tips,
                      unlocks, and per-minute camming payments.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      To provide, support, personalize, and develop the platform, including DMs,
                      menus, feed posts, and camming features.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      To create, maintain, customize, and secure your Discreet account.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      To process transactions, prevent fraud, and ensure the integrity of payments
                      made using credits.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>05</span>
                      To provide user support, investigate concerns, and improve moderation of
                      feed posts, DMs, and cam interactions.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>06</span>
                      To maintain platform safety, security, and integrity, including enforcement
                      of Discreet&apos;s rules on prohibited content (e.g., underage content,
                      bestiality, illegal activity).
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>07</span>
                      For testing, research, analytics, and product development related to
                      features, moderation tooling, and compliance systems.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>08</span>
                      To comply with law enforcement requests, court orders, or other legal
                      obligations, and to support corporate transactions such as mergers or
                      reorganizations.
                    </p>
                  </div>
                  <p>
                    Discreet will not use collected personal information for materially different,
                    unrelated, or incompatible purposes without first providing you with notice.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='sharing-personal-information'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Sharing Personal Information
                  </h1>
                  <p>
                    Discreet may share your personal information with third parties for legitimate
                    business purposes under written contracts that require recipients to use the
                    information only for specified purposes, maintain confidentiality, and comply
                    with data protection laws.
                  </p>
                  <p>
                    In the preceding 12 months, we have disclosed personal information to the
                    following categories of third parties:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Identity and age verification partners (such as Ondato).
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Payment-related service providers for credits deposits and seller payouts.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      Authentication partners (Discord OAuth).
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      Moderation and safety-related providers, where applicable, and technical
                      infrastructure services (hosting, logging, analytics, and cookie-related
                      tools).
                    </p>
                  </div>
                  <p className='mt-2'>
                    Discreet <span className='font-semibold text-white'>does not sell</span>{" "}
                    personal information and has not sold personal information in the preceding 12
                    months.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='your-ccpa-rights'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Your CCPA Rights
                  </h1>
                  <p>
                    If you are a California resident, the CCPA grants you specific rights
                    regarding your personal information, including:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      <span>
                        <span className='font-semibold text-white'>Right to Know and Data Portability:</span>{" "}
                        You may request information about our collection and use of your personal
                        information in the past 12 months, including categories of information, sources,
                        business purposes, categories of third parties, and specific pieces of personal
                        information (subject to legal and security limitations).
                      </span>
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      <span>
                        <span className='font-semibold text-white'>Right to Delete:</span> You may request
                        that we delete personal information we collected from you, subject to certain
                        legal and operational exceptions (for example, to complete transactions you
                        requested, detect fraud, debug services, comply with legal obligations, or use
                        information for internal purposes consistent with your expectations).
                      </span>
                    </p>
                  </div>
                  <p>
                    When we deny or partially deny a deletion request based on an exception, we will
                    explain our decision and delete or deidentify personal information that is not
                    subject to an applicable exception.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='how-to-exercise-your-rights'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    How to Exercise Your Rights
                  </h1>
                  <p>
                    To exercise your CCPA rights to know or delete, you may submit a verifiable
                    consumer request by emailing{" "}
                    <span className='text-[#00b328]'>privacy@discreet.gg</span>.
                  </p>
                  <p>
                    Please include the following so we can verify your identity and locate your
                    account:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Email address associated with your Discreet account
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Discord username used for OAuth login
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      Display name on Discreet (if different)
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      First and last name
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>05</span>
                      Country and state of residence
                    </p>
                  </div>
                  <p className='mt-2'>
                    Only you, or a person legally authorized to act on your behalf, may submit a
                    request to know or delete your personal information. You may submit a request
                    to know no more than twice within a 12‑month period. We may require additional
                    information to verify your identity or authority and will use any verification
                    data solely for that purpose.
                  </p>
                  <p>
                    You do not need to maintain a Discreet account to submit a CCPA request. If you
                    submit a request while logged in to your password-protected account, that
                    method will generally be treated as sufficiently verified for information
                    associated with that account.
                  </p>
                  <p>
                    Discreet will confirm receipt of your request within 10 business days and
                    typically respond within 45 days. If we require more time (up to an additional
                    45 days), we will inform you of the extension and explain the reason.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='non-discrimination'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Non-Discrimination
                  </h1>
                  <p>
                    Discreet will not discriminate against you for exercising any CCPA rights. This
                    means we will not:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Deny you access to the platform or its services;
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Charge different prices or rates (including credits pricing or platform fees)
                      or impose penalties;
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      Provide a different level or quality of services; or
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      Suggest that you may receive different prices, rates, or service levels
                      because you exercised privacy rights.
                    </p>
                  </div>
                  <p>
                    Discreet may offer financial incentives permitted under the CCPA—such as
                    referral or affiliate programs—that could result in different prices, credit
                    values, or earnings. Any such program will be reasonably related to the value
                    of the personal information involved, include written terms outlining the
                    material aspects, and require your prior, voluntary opt‑in consent, which you
                    may revoke at any time.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='other-california-privacy-rights'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Other California Privacy Rights
                  </h1>
                  <p>
                    California&apos;s “Shine the Light” law (Civil Code § 1798.83) allows residents
                    to request information about how a company discloses personal information to
                    third parties for their direct marketing purposes. Discreet does not disclose
                    personal information to third parties for their own direct marketing. To make a
                    request under this law, contact{" "}
                    <span className='text-[#00b328]'>privacy@discreet.gg</span>.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='contact-information'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Contact Information
                  </h1>
                  <p>
                    If you have questions or comments about this notice, the ways in which Discreet
                    collects or uses your personal information, your rights under California law,
                    or if you wish to exercise those rights, you may contact us at:
                  </p>
                  <p>
                    Website:{" "}
                    <span className='text-[#00b328]'>https://www.discreet.gg/support</span>
                  </p>
                  <p>
                    Email: <span className='text-[#00b328]'>privacy@discreet.gg</span>
                  </p>
                  <p>
                    If you require this Privacy Policy in an alternative accessible format due to a
                    disability, please contact{" "}
                    <span className='text-[#00b328]'>privacy@discreet.gg</span>.
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className='w-84 hidden lg:block flex-shrink-0 h-dvh max-h-[1000px] sticky top-0'>
                <PrivacyPolicySidebar headers={californiaPrivacyHeaders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


