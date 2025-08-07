'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, Users, Scale, Cookie, AlertTriangle } from 'lucide-react';

export default function TermsAndPoliciesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Enabl Health
            </Link>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Terms & Policies
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your rights, our responsibilities, and how we protect your health information
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <nav className="sticky top-8 space-y-2">
              <a href="#terms-of-service" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Scale className="w-4 h-4" />
                Terms of Service
              </a>
              <a href="#privacy-policy" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Shield className="w-4 h-4" />
                Privacy Policy
              </a>
              <a href="#usage-policies" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <FileText className="w-4 h-4" />
                Usage Policies
              </a>
              <a href="#sharing-publication" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Users className="w-4 h-4" />
                Sharing & Publication
              </a>
              <a href="#cookie-policy" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Cookie className="w-4 h-4" />
                Cookie Policy
              </a>
              <a href="#disclaimers" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <AlertTriangle className="w-4 h-4" />
                Medical Disclaimers
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-12">
            {/* Terms of Service */}
            <section id="terms-of-service" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Scale className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h2>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Last updated:</strong> August 7, 2025
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    By accessing and using Enabl Health (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. 
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Enabl Health is an AI-powered health assistant platform that provides:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>General health information and wellness guidance</li>
                    <li>Medical document analysis and interpretation</li>
                    <li>Research articles and community health insights</li>
                    <li>Appointment and medication reminder management</li>
                    <li>Personalized health recommendations based on your interactions</li>
                    <li>Integration with third-party services (Google, Apple, Microsoft) for enhanced functionality</li>
                    <li>Calendar synchronization for health appointments and medication schedules</li>
                    <li>Health data import from wearable devices and fitness apps</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. User Accounts and Registration</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    To access certain features of the Service, you may be required to create an account. You are responsible for:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Providing accurate and complete information during registration</li>
                    <li>Updating your information to keep it accurate and current</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Acceptable Use</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    You agree not to use the Service to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Share false, misleading, or harmful health information</li>
                    <li>Attempt to gain unauthorized access to the Service</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Use the Service for commercial purposes without authorization</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Document Upload and User Responsibility</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    When using our document upload and analysis features, you acknowledge and agree that:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li><strong>Upload at Your Own Risk:</strong> You upload documents entirely at your own risk and responsibility</li>
                    <li><strong>Document Ownership:</strong> You must own or have legal rights to upload any documents you submit</li>
                    <li><strong>Privacy Responsibility:</strong> You are responsible for ensuring uploaded documents do not contain unauthorized personal information of others</li>
                    <li><strong>Content Accuracy:</strong> You warrant that all uploaded content is accurate and not misleading</li>
                    <li><strong>Legal Compliance:</strong> Uploaded documents must comply with all applicable laws and regulations</li>
                    <li><strong>No Liability:</strong> Enabl Health assumes no responsibility for the content, accuracy, or legal implications of user-uploaded documents</li>
                    <li><strong>Analysis Limitations:</strong> Document analysis is provided for informational purposes only and does not constitute professional advice</li>
                  </ul>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                    <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                      <strong>Important:</strong> By uploading documents, you explicitly acknowledge that you understand the risks involved 
                      and agree to hold Enabl Health harmless from any consequences arising from your document uploads or their analysis.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. User Agreement and Acknowledgment</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    By creating an account and using Enabl Health services, you explicitly acknowledge that you have:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Read and understood these Terms of Service in their entirety</li>
                    <li>Read and agreed to our Privacy Policy and all associated policies</li>
                    <li>Understood the limitations and risks associated with AI-powered health assistance</li>
                    <li>Acknowledged that Enabl Health is not a substitute for professional medical care</li>
                    <li>Agreed to use the service responsibly and in accordance with all applicable laws</li>
                    <li>Accepted full responsibility for any content you upload or share through the platform</li>
                  </ul>
                  <p className="text-gray-700 dark:text-gray-300 mt-3">
                    <strong>Legal Effect:</strong> Your continued use of the Service constitutes ongoing agreement to these terms. 
                    If you do not agree with any part of these terms, you must discontinue use of the Service immediately.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Intellectual Property</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    The Service and its original content, features, and functionality are and will remain the exclusive property of Enabl Health and its licensors. 
                    The Service is protected by copyright, trademark, and other laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Termination</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
                    under our sole discretion, for any reason whatsoever including, without limitation, a breach of the Terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    In no event shall Enabl Health, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
                    incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                    or other intangible losses, resulting from your use of the Service or any content you upload to the Service.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10. Changes to Terms</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                    If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                </div>
              </div>
            </section>

            {/* Privacy Policy */}
            <section id="privacy-policy" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Last updated:</strong> August 7, 2025
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Information We Collect</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We collect information you provide directly to us, such as:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Account information (name, email, profile details)</li>
                    <li>Health-related queries and conversations</li>
                    <li>Medical documents you choose to upload</li>
                    <li>Usage data and interaction patterns</li>
                    <li>Technical information (IP address, browser type, device information)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How We Use Your Information</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Personalize your health recommendations</li>
                    <li>Communicate with you about the service</li>
                    <li>Ensure the security and integrity of our platform</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Data Security and Encryption</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We implement industry-standard security measures including:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>End-to-end encryption for all health data</li>
                    <li>HIPAA-compliant data storage and processing</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Multi-factor authentication for account access</li>
                    <li>Secure data centers with 24/7 monitoring</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Third-Party Integrations</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Enabl Health integrates with various third-party services to enhance your experience:
                  </p>
                  
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Authentication Services:</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                      <li><strong>Google Sign-In:</strong> Secure authentication using your Google account</li>
                      <li><strong>Apple Sign-In:</strong> Privacy-focused authentication with Apple ID</li>
                      <li><strong>Microsoft Account:</strong> Enterprise-grade authentication for Microsoft users</li>
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Calendar Integration:</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                      <li><strong>Google Calendar:</strong> Sync appointments and medication reminders</li>
                      <li><strong>Apple Calendar:</strong> Integration with iOS and macOS calendar systems</li>
                      <li><strong>Microsoft Outlook:</strong> Calendar sync for business and personal use</li>
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Health & Fitness Services:</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                      <li><strong>Apple HealthKit:</strong> Import health data from iOS devices</li>
                      <li><strong>Google Fit:</strong> Activity tracking and fitness data integration</li>
                      <li><strong>Wearable Devices:</strong> Compatible with major fitness trackers and smartwatches</li>
                    </ul>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mt-4">
                    <strong>Data Handling:</strong> When you connect third-party services, we only access the minimum data 
                    necessary to provide our services. You maintain full control over these integrations and can disconnect 
                    them at any time through your account settings.
                  </p>

                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    <strong>Third-Party Privacy:</strong> Each integrated service has its own privacy policy. We recommend 
                    reviewing the privacy policies of Google, Apple, Microsoft, and other connected services to understand 
                    how they handle your data.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Information Sharing</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We do not sell, trade, or otherwise transfer your personal health information to third parties without your consent, except:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>To provide the services you&apos;ve requested</li>
                    <li>When required by law or legal process</li>
                    <li>To protect our rights or the safety of users</li>
                    <li>With your explicit consent</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Rights and Choices</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    You have the right to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Access and review your personal information</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your data in a portable format</li>
                    <li>Opt-out of certain communications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Data Retention</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We retain your information only as long as necessary to provide our services and comply with legal obligations. 
                    You can request deletion of your data at any time through your account settings.
                  </p>
                </div>
              </div>
            </section>

            {/* Usage Policies */}
            <section id="usage-policies" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usage Policies</h2>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Appropriate Use Guidelines</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Enabl Health is designed to support your health journey. Please use our platform:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>For informational and educational purposes</li>
                    <li>To supplement, not replace, professional medical advice</li>
                    <li>With accurate and honest information</li>
                    <li>Respectfully when interacting with AI agents</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Prohibited Uses</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    The following activities are strictly prohibited:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Using the service for emergency medical situations</li>
                    <li>Attempting to bypass safety mechanisms</li>
                    <li>Sharing another person&apos;s medical information without consent</li>
                    <li>Using the service to diagnose or treat medical conditions</li>
                    <li>Automated or bulk interactions that may harm service performance</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Content Guidelines</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    When interacting with our AI agents, please ensure your content:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Is respectful and appropriate</li>
                    <li>Does not contain harmful or misleading information</li>
                    <li>Respects the privacy of others</li>
                    <li>Complies with applicable laws and regulations</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Sharing & Publication Policy */}
            <section id="sharing-publication" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sharing & Publication Policy</h2>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Community Features</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our community features allow you to share health insights and experiences. When participating:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Only share information you&apos;re comfortable making public</li>
                    <li>Avoid sharing personal medical details</li>
                    <li>Respect others&apos; privacy and experiences</li>
                    <li>Follow community guidelines and moderation policies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Research and Analytics</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We may use aggregated, anonymized data to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Improve our AI models and services</li>
                    <li>Contribute to public health research</li>
                    <li>Generate insights for the healthcare community</li>
                    <li>Publish research findings in medical journals</li>
                  </ul>
                  <p className="text-gray-700 dark:text-gray-300 mt-3">
                    All research use is anonymized and cannot be traced back to individual users.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookie Policy */}
            <section id="cookie-policy" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Cookie className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cookie Policy</h2>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What Are Cookies</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Cookies are small text files stored on your device when you visit our website. 
                    They help us provide a better user experience and understand how our service is used.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Types of Cookies We Use</h3>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li><strong>Essential Cookies:</strong> Required for the service to function properly</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our service</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                    <li><strong>Security Cookies:</strong> Protect against fraud and ensure secure access</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Managing Cookies</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    You can control cookies through your browser settings. However, disabling certain cookies may affect 
                    the functionality of our service.
                  </p>
                </div>
              </div>
            </section>

            {/* Medical Disclaimers */}
            <section id="disclaimers" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Disclaimers</h2>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Important Medical Disclaimer</h3>
                  <p className="text-red-800 dark:text-red-300">
                    Enabl Health is not a substitute for professional medical advice, diagnosis, or treatment. 
                    Always seek the advice of your physician or other qualified health provider with any questions 
                    you may have regarding a medical condition.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Emergency Situations</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Do not use Enabl Health for medical emergencies.</strong> If you are experiencing a medical emergency, 
                    call your local emergency number immediately:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li><strong>Australia:</strong> 000</li>
                    <li><strong>United States:</strong> 911</li>
                    <li><strong>United Kingdom:</strong> 999</li>
                    <li><strong>European Union:</strong> 112</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Limitations of AI Health Advice</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our AI agents provide general health information based on current medical knowledge and research. However:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>AI responses are not personalized medical advice</li>
                    <li>We cannot diagnose medical conditions</li>
                    <li>Treatment recommendations require professional evaluation</li>
                    <li>Individual health circumstances vary significantly</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Document Analysis Limitations</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our document analysis feature helps interpret medical documents but:
                  </p>
                  <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Cannot replace professional medical interpretation</li>
                    <li>May not capture all nuances in complex medical reports</li>
                    <li>Should be discussed with your healthcare provider</li>
                    <li>Is for educational purposes only</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    If you have questions about these policies or need support, please contact us at:
                  </p>
                  <ul className="list-none mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li><strong>Email:</strong> support@enabl.health</li>
                    <li><strong>Privacy:</strong> privacy@enabl.health</li>
                    <li><strong>Legal:</strong> legal@enabl.health</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 Enabl Health. All rights reserved.</p>
            <p className="mt-1 text-sm">
              These policies are effective as of August 7, 2025 and may be updated from time to time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
