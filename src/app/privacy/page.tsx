import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='rounded-lg bg-white p-8 shadow-sm'>
          <div className='mb-8'>
            <h1 className='mb-4 text-3xl font-bold text-gray-900'>
              Privacy Policy
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
                18+ ADULT CONTENT NOTICE
              </div>
              <p className='text-sm text-red-700'>
                This website contains adult content intended for mature
                audiences only. By using this site, you confirm you are 18 years
                or older and legally permitted to view adult content in your
                jurisdiction.
              </p>
            </div>
          </div>

          <div className='prose prose-gray max-w-none'>
            <h2>1. Information We Collect</h2>

            <h3>Personal Information</h3>
            <ul>
              <li>
                <strong>Account Information:</strong> Email address, password
                (encrypted)
              </li>
              <li>
                <strong>Profile Data:</strong> Points balance, purchase history
              </li>
              <li>
                <strong>Payment Information:</strong> Processed securely through
                Stripe (we do not store payment details)
              </li>
              <li>
                <strong>Age Verification:</strong> Confirmation that you are 18+
                (stored locally)
              </li>
            </ul>

            <h3>Usage Information</h3>
            <ul>
              <li>
                <strong>Device Information:</strong> IP address, browser type,
                device type
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, time spent,
                interactions
              </li>
              <li>
                <strong>Location Data:</strong> General location for compliance
                and geo-blocking
              </li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>Provide and maintain our adult content marketplace</li>
              <li>Process payments and manage your account</li>
              <li>Verify age and ensure legal compliance</li>
              <li>Enforce geo-blocking where required by law</li>
              <li>Improve our services and user experience</li>
              <li>Communicate important updates and legal notices</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information. We may
              share information only:
            </p>
            <ul>
              <li>
                <strong>With Service Providers:</strong> Stripe for payments,
                Supabase for data storage
              </li>
              <li>
                <strong>For Legal Compliance:</strong> When required by law or
                to protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In case of merger,
                acquisition, or sale
              </li>
            </ul>

            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li>Encrypted data transmission (HTTPS/SSL)</li>
              <li>Secure database storage with row-level security</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal data</li>
            </ul>

            <h2>5. Age Verification & Adult Content</h2>
            <ul>
              <li>You must be 18+ to access this site</li>
              <li>Age verification is required before viewing content</li>
              <li>
                We comply with adult content regulations in Canada and the U.S.
              </li>
              <li>Geo-blocking may apply in certain jurisdictions</li>
            </ul>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>We use cookies for:</p>
            <ul>
              <li>Authentication and session management</li>
              <li>Age verification persistence</li>
              <li>Shopping cart functionality</li>
              <li>Analytics and performance monitoring</li>
            </ul>

            <h2>8. International Users</h2>
            <p>
              This service is primarily intended for users in Canada and the
              United States. Users from other jurisdictions access at their own
              risk and must comply with local laws regarding adult content.
            </p>

            <h2>9. Changes to Privacy Policy</h2>
            <p>
              We may update this policy periodically. Significant changes will
              be communicated via email or site notification.
            </p>

            <h2>10. Contact Information</h2>
            <p>For privacy-related questions or requests:</p>
            <ul>
              <li>Email: privacy@adultaigallery.com</li>
              <li>Subject Line: "Privacy Policy Inquiry"</li>
            </ul>

            <div className='mt-8 rounded-lg border bg-gray-50 p-4'>
              <h3 className='mb-2 font-semibold text-gray-900'>
                Legal Disclaimer
              </h3>
              <p className='text-sm text-gray-700'>
                This privacy policy is designed to comply with privacy laws in
                Canada (PIPEDA) and the United States. For specific legal advice
                regarding adult content regulations in your jurisdiction,
                consult with a qualified attorney.
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
                  href='/terms'
                  className='text-gray-600 hover:text-gray-800'
                >
                  Terms of Service
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
