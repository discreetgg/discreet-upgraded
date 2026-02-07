import { Separator } from "@/components/ui/separator";
import { Hero } from "../_components/hero";
import { TermsOfServiceSidebar } from "@/components/terms-of-service-sidebar";

const copyrightHeaders = [
  "Introduction",
  "Reporting Copyright Infringement",
  "Counter-Notifications",
  "Repeat Infringers and Remedies",
];

export default function Page() {
  return (
    <div className='bg-[#0f1114] min-h-screen text-[#b3b3b3] py-6 lg:py-12'>
      <div className='max-w-7xl mx-auto px-4 lg:px-6'>
        <div className='flex flex-col lg:flex-row gap-4 lg:gap-8'>
          {/* Main content */}
          <div className='flex-1'>
            <Hero type='Copyright Policy' lastUpdated='November 25, 2025' />
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
                    Discreet respects the intellectual property rights of creators and expects all
                    users to do the same. This Copyright Policy explains how you may report alleged
                    copyright infringement on the Platform and how Discreet may respond in
                    accordance with applicable law, including the Digital Millennium Copyright Act
                    (<span className='italic'>“DMCA”</span>) where applicable.
                  </p>
                  <p>
                    This policy forms part of your agreement with Discreet and should be read
                    together with our Terms of Service and Privacy Policy.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='reporting-copyright-infringement'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Reporting Copyright Infringement
                  </h1>
                  <p>
                    If you believe that content on the Platform infringes your copyright, you or
                    your authorized agent may submit a notice of claimed infringement to our
                    designated copyright agent. Your notice should include, at minimum, the
                    following information:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Identification of the copyrighted work claimed to have been infringed, or a
                      representative list if multiple works are covered by a single notice.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Identification of the allegedly infringing material, including specific URLs
                      or other information reasonably sufficient for Discreet to locate the
                      content.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      Your name, mailing address, telephone number, and email address (or those of
                      your authorized representative).
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      A statement that you have a good‑faith belief that the use of the material is
                      not authorized by the copyright owner, its agent, or the law.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>05</span>
                      A statement, made under penalty of perjury, that the information in the
                      notice is accurate and that you are the copyright owner or authorized to act
                      on the owner&apos;s behalf.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>06</span>
                      A physical or electronic signature of the copyright owner or an authorized
                      representative.
                    </p>
                  </div>
                  <p className='mt-2'>
                    Notices of alleged infringement should be directed to Discreet&apos;s
                    designated copyright contact as indicated in our Terms of Service or by
                    emailing{" "}
                    <span className='text-[#00b328]'>legal@discreet.gg</span> with a clear subject
                    line such as “DMCA Notice”.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='counter-notifications'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Counter-Notifications
                  </h1>
                  <p>
                    If your content is removed as a result of a copyright complaint and you believe
                    that the removal was in error or that you have the right to use the material,
                    you may be able to submit a counter‑notification, subject to applicable law.
                  </p>
                  <p>
                    A valid counter‑notification generally must contain:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Your name, address, telephone number, and email address.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Identification of the material that has been removed or to which access has
                      been disabled, and the location at which the material appeared before it was
                      removed or access to it was disabled.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      A statement under penalty of perjury that you have a good‑faith belief that
                      the material was removed or disabled as a result of mistake or
                      misidentification.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      A statement consenting to the jurisdiction of the appropriate courts and
                      agreeing to accept service of process from the complaining party or its
                      agent.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>05</span>
                      Your physical or electronic signature.
                    </p>
                  </div>
                  <p className='mt-2'>
                    Submitting a false or misleading counter‑notification may have legal
                    consequences. If you are unsure about your rights, you should seek independent
                    legal advice before submitting a notice or counter‑notice.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='repeat-infringers-and-remedies'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Repeat Infringers and Remedies
                  </h1>
                  <p>
                    Discreet may, in appropriate circumstances and at its sole discretion, suspend
                    or terminate the accounts of users who are determined to be repeat infringers
                    or who repeatedly upload or distribute content that violates others&apos;
                    intellectual property rights.
                  </p>
                  <p>
                    We may also remove or restrict access to specific content in response to valid
                    notices, and we reserve all rights and remedies available under applicable law
                    and our Terms of Service.
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className='w-84 hidden lg:block flex-shrink-0 h-dvh max-h-[1000px] sticky top-0'>
                <TermsOfServiceSidebar headers={copyrightHeaders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


