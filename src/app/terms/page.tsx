import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='rounded-lg bg-white p-8 shadow-sm'>
          <div className='mb-8'>
            <h1 className='mb-4 text-3xl font-bold text-gray-900'>
              Terms of Service
            </h1>
            <p className='text-sm text-gray-600'>
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-4'>
              <div className='mb-2 flex items-center gap-2 font-semibold text-red-800'>
                <svg
                  className='h-5 w-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                18+ ADULT CONTENT TERMS
              </div>
              <p className='text-sm text-red-700'>
                By accessing this site, you acknowledge that you are 18 years or
                older and legally permitted to view and purchase adult content
                in your jurisdiction.
              </p>
            </div>
          </div>

          <div className='prose prose-gray max-w-none'>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Adult AI Gallery ("the Service"), you
              accept and agree to be bound by these Terms of Service. If you do
              not agree to these terms, you must not use this service.
            </p>

            <h2>2. Age Verification & Eligibility</h2>
            <ul>
              <li>You must be at least 18 years old to use this service</li>
              <li>
                You must be legally permitted to view adult content in your
                jurisdiction
              </li>
              <li>
                You are responsible for complying with local laws regarding
                adult content
              </li>
              <li>
                False age verification may result in immediate account
                termination
              </li>
            </ul>

            <h2>3. Service Description</h2>
            <p>
              Adult AI Gallery is a premium marketplace for AI-generated adult
              content, including images and videos. We provide:
            </p>
            <ul>
              <li>Digital adult content for purchase</li>
              <li>Points-based and credit card payment systems</li>
              <li>User account management</li>
              <li>Content upload capabilities for approved users</li>
            </ul>

            <h2>4. Account Registration & Security</h2>
            <ul>
              <li>
                You must provide accurate and complete registration information
              </li>
              <li>You are responsible for maintaining account security</li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>One account per person; multiple accounts are prohibited</li>
            </ul>

            <h2>5. Content Guidelines & Prohibited Content</h2>
            <h3>Permitted Content:</h3>
            <ul>
              <li>AI-generated adult content featuring fictional characters</li>
              <li>Content that complies with Canadian and U.S. laws</li>
              <li>Original or properly licensed content</li>
            </ul>

            <h3>Prohibited Content:</h3>
            <ul>
              <li>
                Content depicting minors or individuals appearing to be under 18
              </li>
              <li>Non-consensual content or deepfakes of real individuals</li>
              <li>Content promoting violence, hate, or illegal activities</li>
              <li>Copyrighted material without proper authorization</li>
              <li>Content violating platform community standards</li>
            </ul>

            <h2>6. Payment Terms</h2>
            <h3>Pricing & Payments:</h3>
            <ul>
              <li>All prices are in USD unless otherwise specified</li>
              <li>Payments processed securely through Stripe</li>
              <li>Points purchases are final and non-refundable</li>
              <li>Subscription fees (if applicable) are charged in advance</li>
            </ul>

            <h3>Refund Policy:</h3>
            <ul>
              <li>Digital content sales are generally final</li>
              <li>
                Refunds may be considered for technical issues or billing errors
              </li>
              <li>
                Refund requests must be submitted within 7 days of purchase
              </li>
              <li>Chargebacks may result in account suspension</li>
            </ul>

            <h2>7. User Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Share account credentials or purchased content</li>
              <li>Attempt to circumvent age verification or geo-blocking</li>
              <li>Use automated tools to access or download content</li>
              <li>Engage in harassment or abusive behavior</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2>8. Intellectual Property</h2>
            <ul>
              <li>All content on the platform is protected by copyright</li>
              <li>Purchased content is for personal use only</li>
              <li>Redistribution or commercial use is strictly prohibited</li>
              <li>
                We respect intellectual property rights and respond to valid
                DMCA notices
              </li>
            </ul>

            <h2>9. Privacy & Data Protection</h2>
            <p>
              Your privacy is important to us. Please review our
              <Link
                href='/privacy'
                className='text-indigo-600 hover:text-indigo-800'
              >
                Privacy Policy
              </Link>{' '}
              to understand how we collect, use, and protect your information.
            </p>

            <h2>10. Geographic Restrictions</h2>
            <ul>
              <li>
                This service is primarily intended for users in Canada and the
                United States
              </li>
              <li>Geo-blocking may be implemented for legal compliance</li>
              <li>
                Users accessing from restricted jurisdictions do so at their own
                risk
              </li>
              <li>We reserve the right to block access from any location</li>
            </ul>

            <h2>11. Account Termination</h2>
            <p>We may suspend or terminate your account for:</p>
            <ul>
              <li>Violation of these terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Chargebacks or payment disputes</li>
              <li>Inactivity for extended periods</li>
            </ul>

            <h2>12. Disclaimers & Limitations</h2>
            <ul>
              <li>Service provided "as is" without warranties</li>
              <li>We are not liable for content accuracy or availability</li>
              <li>Liability limited to the amount paid for services</li>
              <li>We do not guarantee uninterrupted service</li>
            </ul>

            <h2>13. Governing Law</h2>
            <p>
              These terms are governed by the laws of Canada and the United
              States. Disputes will be resolved through binding arbitration
              where permitted by law.
            </p>

            <h2>14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time.
              Significant changes will be communicated via email or site
              notification. Continued use constitutes acceptance of modified
              terms.
            </p>

            <h2>15. Contact Information</h2>
            <p>For questions about these terms:</p>
            <ul>
              <li>Email: legal@adultaigallery.com</li>
              <li>Subject Line: "Terms of Service Inquiry"</li>
            </ul>

            <div className='mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
              <h3 className='mb-2 font-semibold text-yellow-900'>
                Important Legal Notice
              </h3>
              <p className='text-sm text-yellow-800'>
                These terms are designed to comply with adult content
                regulations in Canada and the United States. Users are
                responsible for ensuring compliance with local laws in their
                jurisdiction. Consult legal counsel if you have questions about
                the legality of adult content in your area.
              </p>
            </div>
          </div>

          <div className='mt-8 border-t border-gray-200 pt-6'>
            <div className='flex items-center justify-between'>
              <Link
                href='/'
                className='font-medium text-indigo-600 hover:text-indigo-800'
              >
                ← Back to Home
              </Link>
              <div className='flex gap-4'>
                <Link
                  href='/privacy'
                  className='text-gray-600 hover:text-gray-800'
                >
                  Privacy Policy
                </Link>
                <Link
                  href='/cookies'
                  className='text-gray-600 hover:text-gray-800'
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
