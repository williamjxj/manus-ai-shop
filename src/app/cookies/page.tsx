import Link from 'next/link'

export default function CookiePolicy() {
  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='rounded-lg bg-white p-8 shadow-sm'>
          <div className='mb-8'>
            <h1 className='mb-4 text-3xl font-bold text-gray-900'>
              Cookie Policy
            </h1>
            <p className='text-sm text-gray-600'>
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <div className='mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <div className='mb-2 flex items-center gap-2 font-semibold text-blue-800'>
                <svg
                  className='h-5 w-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
                Cookie Usage Notice
              </div>
              <p className='text-sm text-blue-700'>
                This website uses cookies to enhance your experience, maintain
                your session, and remember your age verification status. By
                using our site, you consent to our use of cookies as described
                in this policy.
              </p>
            </div>
          </div>

          <div className='prose prose-gray max-w-none'>
            <h2>What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit
              a website. They help websites remember information about your
              visit, making your next visit easier and the site more useful to
              you.
            </p>

            <h2>How We Use Cookies</h2>

            <h3>Essential Cookies (Always Active)</h3>
            <p>
              These cookies are necessary for the website to function properly:
            </p>
            <ul>
              <li>
                <strong>Authentication:</strong> Keep you logged in to your
                account
              </li>
              <li>
                <strong>Age Verification:</strong> Remember that you've
                confirmed you're 18+
              </li>
              <li>
                <strong>Shopping Cart:</strong> Maintain items in your cart
                between sessions
              </li>
              <li>
                <strong>Security:</strong> Protect against cross-site request
                forgery
              </li>
              <li>
                <strong>Session Management:</strong> Maintain your browsing
                session
              </li>
            </ul>

            <h3>Functional Cookies</h3>
            <p>These cookies enhance your experience:</p>
            <ul>
              <li>
                <strong>Preferences:</strong> Remember your display settings and
                preferences
              </li>
              <li>
                <strong>Language:</strong> Remember your language selection
              </li>
              <li>
                <strong>Location:</strong> Remember your general location for
                compliance
              </li>
            </ul>

            <h3>Analytics Cookies</h3>
            <p>These cookies help us understand how you use our site:</p>
            <ul>
              <li>
                <strong>Usage Analytics:</strong> Track page views and user
                interactions
              </li>
              <li>
                <strong>Performance:</strong> Monitor site performance and
                loading times
              </li>
              <li>
                <strong>Error Tracking:</strong> Identify and fix technical
                issues
              </li>
            </ul>

            <h2>Specific Cookies We Use</h2>

            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 border border-gray-300'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-2 text-left text-xs font-medium uppercase text-gray-500'>
                      Cookie Name
                    </th>
                    <th className='px-4 py-2 text-left text-xs font-medium uppercase text-gray-500'>
                      Purpose
                    </th>
                    <th className='px-4 py-2 text-left text-xs font-medium uppercase text-gray-500'>
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  <tr>
                    <td className='px-4 py-2 text-sm font-medium text-gray-900'>
                      ageVerified
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500'>
                      Stores age verification status
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500'>30 days</td>
                  </tr>
                  <tr>
                    <td className='px-4 py-2 text-sm font-medium text-gray-900'>
                      supabase-auth-token
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500'>
                      Authentication session
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500'>7 days</td>
                  </tr>
                  <tr>
                    <td className='px-4 py-2 text-sm font-medium text-gray-900'>
                      cart-session
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500'>
                      Shopping cart persistence
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500'>
                      24 hours
                    </td>
                  </tr>
                  <tr>
                    <td className='px-4 py-2 text-sm font-medium text-gray-900'>
                      user-preferences
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500'>
                      Display and UI preferences
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500'>90 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>Third-Party Cookies</h2>
            <p>We may use third-party services that set their own cookies:</p>

            <h3>Stripe (Payment Processing)</h3>
            <ul>
              <li>Used for secure payment processing</li>
              <li>Helps prevent fraud and ensure transaction security</li>
              <li>Subject to Stripe's privacy policy</li>
            </ul>

            <h3>Supabase (Database & Authentication)</h3>
            <ul>
              <li>Manages user authentication and data storage</li>
              <li>Ensures secure access to your account</li>
              <li>Subject to Supabase's privacy policy</li>
            </ul>

            <h2>Managing Your Cookie Preferences</h2>

            <h3>Browser Settings</h3>
            <p>You can control cookies through your browser settings:</p>
            <ul>
              <li>
                <strong>Chrome:</strong> Settings → Privacy and Security →
                Cookies
              </li>
              <li>
                <strong>Firefox:</strong> Preferences → Privacy & Security →
                Cookies
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Cookies
              </li>
              <li>
                <strong>Edge:</strong> Settings → Cookies and Site Permissions
              </li>
            </ul>

            <h3>Important Notes About Disabling Cookies</h3>
            <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
              <p className='text-sm text-yellow-800'>
                <strong>Warning:</strong> Disabling essential cookies will
                prevent the website from functioning properly. You may not be
                able to:
              </p>
              <ul className='mt-2 text-sm text-yellow-800'>
                <li>Stay logged in to your account</li>
                <li>Maintain items in your shopping cart</li>
                <li>Complete purchases</li>
                <li>Access age-restricted content</li>
              </ul>
            </div>

            <h2>Cookie Consent</h2>
            <p>
              By continuing to use our website, you consent to our use of
              cookies as described in this policy. We may update this policy
              from time to time, and we'll notify you of any significant
              changes.
            </p>

            <h2>Adult Content & Age Verification Cookies</h2>
            <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
              <p className='text-sm text-red-800'>
                <strong>Special Notice:</strong> Our age verification cookie is
                essential for legal compliance. This cookie remembers that
                you've confirmed you're 18+ and legally permitted to view adult
                content. Clearing this cookie will require you to verify your
                age again.
              </p>
            </div>

            <h2>Contact Us</h2>
            <p>If you have questions about our cookie policy:</p>
            <ul>
              <li>Email: privacy@adultaigallery.com</li>
              <li>Subject Line: "Cookie Policy Inquiry"</li>
            </ul>

            <h2>Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy periodically to reflect changes
              in our practices or for legal compliance. We'll post the updated
              policy on this page with a new "Last updated" date.
            </p>
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
                  href='/terms'
                  className='text-gray-600 hover:text-gray-800'
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
