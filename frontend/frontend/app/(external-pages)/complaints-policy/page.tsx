import { Separator } from "@/components/ui/separator";
import { Hero } from "../_components/hero";
import { TermsOfServiceSidebar } from "@/components/terms-of-service-sidebar";

const complaintsHeaders = [
  "Introduction",
  "How to Submit a Complaint",
  "How We Handle Complaints",
  "Escalation and External Remedies",
];

export default function Page() {
  return (
    <div className='bg-[#0f1114] min-h-screen text-[#b3b3b3] py-6 lg:py-12'>
      <div className='max-w-7xl mx-auto px-4 lg:px-6'>
        <div className='flex flex-col lg:flex-row gap-4 lg:gap-8'>
          {/* Main content */}
          <div className='flex-1'>
            <Hero type='Complaints Policy' lastUpdated='November 25, 2025' />
            <Separator />

            <div className='flex flex-col lg:flex-row gap-4 lg:gap-8 items-start relative'>
              <div className='flex-1 flex flex-col gap-y-4 items-start'>
                <div className='space-y-4 lg:space-y-6 text-sm leading-relaxed py-8 lg:py-[100px] px-4 lg:px-6 justify-center max-w-7xl mx-auto'>
                  <h1
                    id='introduction'
                    className='text-3xl lg:text-[45px] font-bold mb-6 lg:mb-12 text-white'
                  >
                    Introduction
                  </h1>
                  <p>
                    This Complaints Policy forms part of your binding agreement with Potion Labs
                    LLC, the owner and operator of Discreet (<span className='text-white font-medium'>
                      discreet.gg
                    </span>
                    ) and its affiliated services (<span className='italic'>“the Platform”</span>).
                    By accessing or using the Platform, you agree to the terms of this policy.
                    Please read it carefully.
                  </p>
                  <p>
                    By submitting any complaint, you confirm that the information you provide is
                    accurate and truthful. Discreet may request additional documentation or
                    clarification where needed to investigate and resolve your complaint.
                  </p>
                  <p>
                    Discreet and its affiliated services are owned and operated by Potion Labs LLC,
                    a limited liability company organized under the laws of Wyoming.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='how-to-submit-a-complaint'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    How to Submit a Complaint
                  </h1>
                  <p>
                    You may submit complaints regarding the Platform—such as content moderation
                    decisions, account actions, payment concerns, or other issues—through the
                    following methods:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Via our support portal:{" "}
                      <span className='text-[#00b328]'>https://www.discreet.gg/support</span>
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      By email to{" "}
                      <span className='text-[#00b328]'>support@discreet.gg</span> for general
                      complaints or account issues.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      By email to{" "}
                      <span className='text-[#00b328]'>compliance@discreet.gg</span> for safety,
                      CSAM, trafficking, or other serious abuse matters.
                    </p>
                  </div>
                  <p className='mt-2'>
                    When submitting a complaint, please include sufficient details to help us
                    understand and investigate the issue, such as:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Your Discreet display name and associated email address
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Relevant dates and times
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      Links or IDs to content, accounts, or transactions involved
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      A clear description of what happened and what outcome you seek
                    </p>
                  </div>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='how-we-handle-complaints'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    How We Handle Complaints
                  </h1>
                  <p>
                    Discreet takes complaints seriously and uses them to improve the Platform,
                    moderation systems, and user safety. Once we receive your complaint, we will:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Acknowledge receipt of your complaint within a reasonable time.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Review and investigate the matter, which may include examining logs,
                      content, communications, or interactions related to your complaint.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      Where appropriate, contact you for additional information or clarification.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      Take remedial steps where we determine that our Terms of Service, content
                      standards, or policies were not properly applied.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>05</span>
                      Provide you with a response explaining the outcome of our review, subject to
                      legal and safety constraints.
                    </p>
                  </div>
                  <p>
                    In some cases, we may be legally required not to disclose certain details
                    (for example, where doing so would compromise another user&apos;s privacy,
                    a law‑enforcement investigation, or platform security measures).
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='escalation-and-external-remedies'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Escalation and External Remedies
                  </h1>
                  <p>
                    If you disagree with the outcome of a complaint or believe we have not handled
                    your complaint in accordance with our Terms of Service or this policy, you may
                    request further review by contacting{" "}
                    <span className='text-[#00b328]'>legal@discreet.gg</span>.
                  </p>
                  <p>
                    If you are a resident of the United Kingdom, you may also have additional
                    rights under the UK Online Safety Act, including the ability to bring a breach
                    of contract claim if we fail to comply with our Terms of Service in relation
                    to:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Removal or restriction of your content without appropriate justification; or
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Suspension of your account in a manner inconsistent with our Terms of Service
                      or Code of Conduct.
                    </p>
                  </div>
                  <p>
                    Nothing in this policy or in our Terms of Service affects your statutory
                    rights under applicable law.
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className='w-84 hidden lg:block flex-shrink-0 h-dvh max-h-[1000px] sticky top-0'>
                <TermsOfServiceSidebar headers={complaintsHeaders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


