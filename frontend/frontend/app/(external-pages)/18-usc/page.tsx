import { Separator } from "@/components/ui/separator";
import { Hero } from "../_components/hero";
import { TermsOfServiceSidebar } from "@/components/terms-of-service-sidebar";

// Array of all section headers in the 18 U.S.C. 2257 statement
const usc2257Headers = [
  "18 U.S.C. 2257 Statement",
  "Exemption for Seller-Produced Content",
  "Exemption for Discreet-Created Content",
  "Designated Custodian of Records",
];

export default function Page() {
  return (
    <div className='bg-[#0f1114] min-h-screen text-[#b3b3b3] py-6 lg:py-12'>
      <div className='max-w-7xl mx-auto px-4 lg:px-6'>
        <div className='flex flex-col lg:flex-row gap-4 lg:gap-8'>
          {/* Main content */}
          <div className='flex-1'>
            <Hero type='2257' lastUpdated='November 25, 2025' />

            <Separator />

            <div className='flex flex-col lg:flex-row gap-4 lg:gap-8 items-start relative'>
              <div className='flex-1 flex flex-col gap-y-4 items-start'>
                <div className='space-y-4 lg:space-y-6 text-sm leading-relaxed py-8 lg:py-[100px] px-4 lg:px-6 justify-center max-w-7xl mx-auto'>
                  <h1
                    id='18-usc-2257-statement'
                    className='text-3xl lg:text-[45px] font-bold mb-6 lg:mb-12 text-white'
                  >
                    18 U.S.C. 2257 Statement
                  </h1>
                  <p>
                    Any individual that appears in any visual depiction of sexually explicit
                    conduct appearing on, or otherwise contained in, the Platform located at
                    <span className='text-white font-medium'> discreet.gg</span> (the
                    <span className='italic'> “Website”</span> or
                    <span className='italic'> “Platform”</span>) was at least eighteen (18) years
                    of age at the time such visual depictions were created.
                  </p>
                  <p>
                    All sellers on the Platform are required, as a condition of use, to represent
                    and warrant that every individual depicted in content they upload or otherwise
                    provide is at least 18 years old at the time of production and that they have
                    obtained and maintain all required age-verification records.
                  </p>
                  <p>
                    The Website is operated by Potion Labs LLC, a limited liability company
                    organized under the laws of Wyoming (<span className='italic'>
                      “Discreet,” “we,” “us,”
                    </span>{" "}
                    or
                    <span className='italic'> “our”</span>). The Website and related services are
                    intended for adults 18+ only.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='exemption-for-seller-produced-content'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Exemption for Seller-Produced Content
                  </h1>
                  <p>
                    Discreet is not the “primary producer,” as that term is defined in 18 U.S.C.
                    § 2257 and 28 C.F.R. Part 75, of any depictions of actual or simulated
                    sexually explicit conduct that may appear on the Platform. All such content is
                    created and uploaded by independent third-party users of the Platform (
                    <span className='italic'>“sellers”</span>), who are solely responsible for the
                    production of their content and any associated record-keeping obligations
                    under 18 U.S.C. § 2257 and 28 C.F.R. Part 75.
                  </p>
                  <p>
                    Discreet&apos;s role with respect to seller-generated content is limited to
                    that of a secondary producer and/or service provider that performs the
                    activities of transmission, storage, retrieval, hosting, or formatting of
                    material that may depict sexually explicit conduct, all of which appears on
                    the Platform as the result of actions taken by third-party sellers.
                  </p>
                  <p>
                    All parts of the Platform that contain user-generated material—including but
                    not limited to feed posts, menus, unlockable DM content, tips, and 1-on-1
                    camming interactions—are under the control of the relevant seller, for whom the
                    Platform is provided as an online service.
                  </p>
                  <p>
                    Under 18 U.S.C. § 2257(h)(2)(B)(v) and 47 U.S.C. § 230(c), Discreet may, in its
                    sole discretion, remove or disable access to any materials appearing on the
                    Platform as the result of actions taken by users that Discreet deems, in its
                    sole judgment, to be indecent, obscene, defamatory, unlawful, or otherwise
                    inconsistent with our policies, Terms of Service, or community guidelines,
                    including our strict prohibition on underage content and other illegal
                    material.
                  </p>
                  <p>
                    Each seller is solely responsible for: (1) acting as the “primary producer”
                    with respect to the content they create or upload; (2) verifying and
                    documenting, in compliance with 18 U.S.C. § 2257 and 28 C.F.R. Part 75, that
                    every person appearing in such content is at least 18 years of age at the time
                    of production; and (3) maintaining and organizing all required 2257 records for
                    their content, including making such records available to law enforcement or
                    regulators as required by applicable law.
                  </p>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='exemption-for-discreet-created-content'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Exemption for Discreet-Created Content
                  </h1>
                  <p>
                    To the extent that any images, videos, or other visual depictions appear on the
                    Platform for which Discreet may be considered a “producer” or “secondary
                    producer” under 18 U.S.C. § 2257 and 28 C.F.R. Part 75 (for example, certain
                    marketing or promotional materials created or acquired by Discreet to promote
                    the Platform), such images or videos are exempt from the record-keeping
                    requirements of 18 U.S.C. § 2257 and 28 C.F.R. Part 75 for one or more of the
                    following reasons:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      The images or videos do not portray “sexually explicit conduct” as defined in
                      18 U.S.C. § 2256(2)(A);
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      The images or videos do not portray depictions of the genitals or pubic area
                      created after July 27, 2006;
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>03</span>
                      The images or videos do not portray simulated sexually explicit activity
                      occurring after the effective date of 18 U.S.C. § 2257A; or
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>04</span>
                      The images or videos were created before July 3, 1995.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className='space-y-4 py-8 lg:py-[100px] px-4 lg:px-6 max-w-7xl mx-auto w-full'>
                  <h1
                    id='designated-custodian-of-records'
                    className='text-3xl lg:text-[45px] font-bold text-[#ffffff] mb-6 lg:mb-12'
                  >
                    Designated Custodian of Records
                  </h1>
                  <p>
                    Without limiting in any way the applicability of the exemptions stated above,
                    Discreet has designated the custodian identified below to be the keeper of
                    original records described in 18 U.S.C. § 2257 and 28 C.F.R. Part 75, but only
                    for the following categories of materials appearing on the Platform:
                  </p>
                  <div className='space-y-2 mt-2'>
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>01</span>
                      Marketing and advertising materials that contain visual depictions of actual
                      or simulated sexually explicit conduct, which materials have been acquired or
                      created by Discreet to promote the Platform; and
                    </p>
                    <Separator />
                    <p className='flex flex-col gap-2'>
                      <span className='text-white font-semibold'>02</span>
                      Any other materials for which Discreet is not exempt as described above and
                      for which Discreet is, under applicable law, required to maintain records as a
                      producer or secondary producer.
                    </p>
                  </div>
                  <p>
                    This designation does not apply to seller-generated content, for which each
                    seller, as the primary producer, is individually and solely responsible for
                    maintaining 2257-compliant records at their own designated location. Discreet
                    does not maintain 2257 records on behalf of sellers.
                  </p>
                  <div className='mt-4 space-y-1'>
                    <h2 className='text-2xl font-semibold text-white'>Custodian of Records</h2>
                    <p>Name: Nat Smith</p>
                    <p>Address: 30 N GOULD ST N, Sheridan, WY 82801</p>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className='w-84 hidden lg:block flex-shrink-0 h-dvh max-h-[1000px] sticky top-0'>
                <TermsOfServiceSidebar headers={usc2257Headers} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


