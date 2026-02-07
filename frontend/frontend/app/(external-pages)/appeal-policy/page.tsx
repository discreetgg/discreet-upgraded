import { Separator } from "@/components/ui/separator";
import { Hero } from "../_components/hero";
import { TermsOfServiceSidebar } from "@/components/terms-of-service-sidebar";

const appealHeaders = [
  "Introduction",
  "Decisions You Can Appeal",
  "How to Submit an Appeal",
  "Review Process and Outcomes",
];

export default function Page() {
  return (
    <div className='bg-[#0f1114] min-h-screen text-[#b3b3b3] py-6 lg:py-12'>
      <div className='max-w-7xl mx-auto px-4 lg:px-6'>
        <div className='flex flex-col lg:flex-row gap-4 lg:gap-8'>
          {/* Main content */}
          <div className='flex-1'>
            <Hero type='Appeal Policy' lastUpdated='November 25, 2025' />
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
                    This Appeal Policy explains how you can request a review of certain moderation
                    or account decisions made by Discreet. It forms part of your agreement with
                    Potion Labs LLC and should be read together with our Terms of Service,
                    Complaints Policy, and other applicable policies.
                  </p>
                  <p>
                    By submitting an appeal, you confirm that the information you provide is
                    accurate and complete to the best of your knowledge.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='decisions-you-can-appeal'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Decisions You Can Appeal
                  </h1>
                  <p>
                    You may request an appeal of certain Platform decisions, which may include:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Removal or restriction of your content for alleged policy violations.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Suspension, restriction, or termination of your account based on alleged
                      violations of Discreet&apos;s Terms of Service or Code of Conduct.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      Certain moderation actions that materially impact your ability to use the
                      Platform or interact with buyers or sellers.
                    </p>
                  </div>
                  <p>
                    Some decisions—for example, those required by law, law‑enforcement requests, or
                    safety obligations (such as credible reports of CSAM, trafficking, or serious
                    threats)—may not be appealable, or may only be reviewed in limited ways.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='how-to-submit-an-appeal'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    How to Submit an Appeal
                  </h1>
                  <p>
                    To request an appeal, please contact us through the Discreet support portal at{" "}
                    <span className='text-[#00b328]'>https://www.discreet.gg/support</span> or by
                    emailing <span className='text-[#00b328]'>support@discreet.gg</span>.
                  </p>
                  <p>
                    Your appeal should clearly identify the decision you are challenging and
                    include:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Your Discreet display name and associated email address.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Any relevant reference numbers or links (for example, content URLs, dates of
                      takedown notices, or account suspension notices).
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      A concise explanation of why you believe the decision was incorrect or
                      inconsistent with Discreet&apos;s policies.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      Any supporting information or context you would like us to consider (such as
                      evidence of rights to content or clarifying details).
                    </p>
                  </div>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='review-process-and-outcomes'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Review Process and Outcomes
                  </h1>
                  <p>
                    Once we receive your appeal, Discreet will review the decision, which may
                    include re-evaluating the content or conduct at issue, reviewing internal
                    logs, and consulting applicable policies.
                  </p>
                  <p>
                    We aim to respond to appeals within a reasonable period. Possible outcomes may
                    include:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Upholding the original decision.
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Reversing or modifying the decision (for example, restoring content).
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      Taking alternative actions permitted under our Terms (such as applying a
                      warning instead of a suspension).
                    </p>
                  </div>
                  <p>
                    Where we are unable to share specific details about our internal processes or
                    signals (for example, to protect safety systems or other users&apos; privacy),
                    we will nevertheless explain the result of the appeal at a high level.
                  </p>
                  <p>
                    Nothing in this Appeal Policy limits any rights you may have under applicable
                    law, including rights under the UK Online Safety Act or other consumer
                    protection laws, where they apply.
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className='w-84 hidden lg:block flex-shrink-0 h-dvh max-h-[1000px] sticky top-0'>
                <TermsOfServiceSidebar headers={appealHeaders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


