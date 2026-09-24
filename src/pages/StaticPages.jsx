import { Helmet } from 'react-helmet-async';

const StaticPage = ({ title, children }) => (
  <>
    <Helmet>
      <title>{title} - The Great India News</title>
    </Helmet>
    <div className="container-news py-8 max-w-3xl">
      <h1 className="text-3xl font-bold font-headline mb-6">{title}</h1>
      <div className="text-gray-700 leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  </>
);

export const Contact = () => (
  <StaticPage title="Contact Us">
    <p><strong>Email:</strong> contact@thegreatindianews.com</p>
    <p><strong>Phone:</strong> +91 9876543210</p>
    <p><strong>Address:</strong> Chennai, Tamil Nadu, India</p>
  </StaticPage>
);

export const PrivacyPolicy = () => (
  <StaticPage title="Privacy Policy">
    <p>
      This document clarifies how The Great India News (thegreatindianews.com) and its related mobile
      applications collect, process, and safeguard your personal details. We are strictly committed to
      keeping all reader metrics safe and securely protected.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">1. Data Collected on Website &amp; Mobile App</h2>
    <p className="mb-3">
      We collect information to customize and personalize your news tracking experience:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li>
        <strong>Profile Information:</strong> When you register an account, comment, or interact with our
        members area we collect your name, email address, password, and preferences.
      </li>
      <li>
        <strong>Offline Storage &amp; Read Milestones:</strong> We measure and record connection parameters
        and read engagements (such as our 20s, 45s, and 90s milestones) locally inside high-performance
        databases to serve you cached stories when offline.
      </li>
      <li>
        <strong>Device &amp; Network Data:</strong> Connection attributes including IP address, browser type,
        device fingerprints, operating system, and system locales are gathered automatically.
      </li>
    </ul>

    <h2 className="text-xl font-bold mt-8 mb-3">2. Usage, Sharing, and Protection of Your Data</h2>
    <p className="mb-3">
      Your details are exclusively used to optimize client operations and support independent content.
      We enforce these criteria:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li>
        <strong>Personalization:</strong> Tuning display sizes, localized spot rates (e.g. silver and gold
        rates), and curated newsletter digests.
      </li>
      <li>
        <strong>Security Measures:</strong> We apply secure industry SSL/TLS encryption. All critical
        databases are protected behind tokenized cloud firewall controls.
      </li>
      <li>
        <strong>Third-Party Sharing (Restricted):</strong> We integrate with trusted services only. We share
        non-personally identifiable browser cookies with Google AdSense (for banner and vignette
        advertisement delivery) and Google Analytics (for traffic telemetry reporting). We do NOT sell or
        syndicate details to third parties.
      </li>
    </ul>

    <h2 className="text-xl font-bold mt-8 mb-3">3. Data and Mobile Account Deletion Request</h2>
    <p>
      In strict accordance with the Google Play Store App Developer Policies, users can request the deletion
      of their accounts and associated personal records at any time. To delete your data, simply use the
      Account &amp; Security panel inside the app dashboard, or send a request email to{' '}
      <a href="mailto:grievance@thegreatindianews.com" className="text-brand-600 hover:underline">
        grievance@thegreatindianews.com
      </a>{' '}
      with the subject line &ldquo;Data Deletion Request&rdquo;. All personal registration details, comments
      history, and read logs will be permanently scrubbed from our active cloud and offline databases within
      14 business days.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">4. Cookie Control &amp; Opt-out Mechanisms</h2>
    <p>
      This site utilizes browser cookies to save localized preference variables (such as custom font
      selections, bento layout density, and theme preferences). You can easily specify cookie handling within
      your browser settings, or deny specific tracking by managing settings inside our monetization hubs.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">5. Legal Redressal Under IT Rules 2021 (India)</h2>
    <p>
      As an Indian digital publisher, we correspond directly with local IT standards. Any reader grievance
      can be registered with our appointed Grievance Officer, Mr. R. Bala Murugan, at{' '}
      <a href="mailto:grievance@thegreatindianews.com" className="text-brand-600 hover:underline">
        grievance@thegreatindianews.com
      </a>
      . Resolution occurs within 15 days of formal acknowledgement.
    </p>
  </StaticPage>
);

export const Terms = () => (
  <StaticPage title="Terms of Use">
    <p>
      Please read these Terms of Service carefully before utilizing The Great India News services. By
      accessing our news updates, you fully agree to follow these legal requirements.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">1. Acceptable Use of Our Services</h2>
    <p className="mb-3">
      You correspond strictly with standard community rules when posting comments:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li>No hate speech, defaming language, or spamming is permitted.</li>
      <li>All intellectual content on the portal remains the sole property of our Bureau.</li>
    </ul>

    <h2 className="text-xl font-bold mt-8 mb-3">2. Subscription, Account Security &amp; Registration</h2>
    <p>
      Users can register accounts to preserve bookmark folders and track engagement. Keep passwords secure.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">3. Indemnification and Liability Disclaimers</h2>
    <p>
      Our news archives are served for informational purposes only. The Bureau is not liable for structural
      updates.
    </p>
  </StaticPage>
);

export const EditorialPolicy = () => (
  <StaticPage title="Editorial Policy">
    <p>
      The Great India News is built upon double-layered validation and trusted, ground-zero journalism.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">1. Double-Layered Story Verification</h2>
    <p className="mb-3">
      Our reporting stack is certified by rigorous secondary audits:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li>All claims must have double-layered citation mappings.</li>
      <li>
        No sensationalism or anonymous reporting is accepted unless vetted by the Editor-in-Chief.
      </li>
    </ul>

    <h2 className="text-xl font-bold mt-8 mb-3">2. Retraction &amp; Error Correction Timelines</h2>
    <p>
      We believe in full transparency. When mistakes are verified, we commit to publishing clear
      corrections within 24 business hours.
    </p>
  </StaticPage>
);

export const CorrectionPolicy = () => (
  <StaticPage title="Correction Policy">
    <p>We are committed to accuracy. If you find an error in our reporting, please contact us at corrections@thegreatindianews.com. We will review and publish corrections promptly.</p>
  </StaticPage>
);

export const Copyright = () => (
  <StaticPage title="Copyright">
    <p>© 2026 The Great India News. All content, including text, images, and videos, is protected by copyright law. Unauthorized reproduction is prohibited.</p>
  </StaticPage>
);
export const Grievance = () => (
  <StaticPage title="Grievance Redressal">
    <p>If you have any grievances regarding our content or services, please write to grievance@thegreatindianews.com. We will address your concerns within 15 working days.</p>
  </StaticPage>
);

export const Disclaimer = () => (
  <StaticPage title="Disclaimer">
    <p>
      Welcome to &ldquo;THE GREAT INDIA NEWS,&rdquo; your trusted source for news and information in Tamil.
      Before using our website and accessing our content, please read this disclaimer carefully.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Accuracy of Information</h2>
    <p>
      While we strive to provide accurate and up-to-date information, &ldquo;THE GREAT INDIA News&rdquo;
      cannot guarantee the completeness, reliability, or accuracy of the content published on our website.
      The views and opinions expressed in articles, opinion pieces, and other forms of content are those of
      the authors and do not necessarily reflect the views of &ldquo;THE GREAT INDIA News&rdquo; or its
      editorial team.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Editorial Integrity</h2>
    <p>
      Our editorial team adheres to strict journalistic standards and ethics in the creation and publication
      of content. We maintain editorial independence and objectivity in reporting news and strive to present
      balanced and unbiased perspectives on various topics. However, readers should exercise their own
      judgment and discretion when interpreting and relying on the information provided.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Third-Party Content</h2>
    <p>
      &ldquo;THE GREAT INDIA NEWS&rdquo; may contain links to third-party websites, articles, or resources
      for informational purposes. We do not endorse or guarantee the accuracy of the content provided on
      these external sites and are not responsible for any loss or damage that may arise from their use.
      Users should review the terms of use and privacy policies of these third-party sites before accessing
      their content.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">No Legal or Professional Advice</h2>
    <p>
      The information provided on &ldquo;THE GREAT INDIA NEWS&rdquo; is for general informational purposes
      only and should not be construed as legal, financial, medical, or professional advice. Readers should
      seek appropriate professional advice or conduct their own research before making any decisions based
      on the information provided on our website.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Changes to Content</h2>
    <p>
      &ldquo;THE GREAT INDIA NEWS&rdquo; reserves the right to modify, update, or remove content from our
      website at any time without prior notice. We may also revise this disclaimer or other policies
      governing the use of our website. By continuing to use our website, you agree to be bound by the most
      current version of these terms and conditions.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Limitation of Liability</h2>
    <p>
      Under no circumstances shall &ldquo;THE GREAT INDIA NEWS&rdquo; or its affiliates be liable for any
      direct, indirect, incidental, special, or consequential damages arising out of the use or inability to
      use our website or the content provided therein. This includes but is not limited to damages for loss
      of profits, data, or goodwill.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Contact Us</h2>
    <p>
      If you have any questions or concerns about this disclaimer or our website&rsquo;s content, please
      contact us at{' '}
      <a href="mailto:grievance@thegreatindianews.com" className="text-brand-600 hover:underline">
        grievance@thegreatindianews.com
      </a>
      .
    </p>
  </StaticPage>
);

export const GdprPrivacyPolicy = () => (
  <StaticPage title="GDPR Privacy Policy">
    <p>
      At &ldquo;THE GREAT INDIA NEWS&rdquo;, we are committed to protecting the privacy and personal data of
      our users in compliance with the General Data Protection Regulation (GDPR). This policy outlines how
      we collect, use, disclose, and protect personal data when you use our website and services.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Data Collection and Processing</h2>
    <p className="mb-3">
      We collect and process personal data for specified, explicit, and legitimate purposes. When you visit
      our website or interact with our services, we may collect the following types of personal data:
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li>
        <strong>Contact Information:</strong> Such as your name, email address, postal address, and phone
        number, which you provide when subscribing to our magazine or signing up for our newsletter.
      </li>
      <li>
        <strong>Usage Information:</strong> Such as your IP address, browser type, device information, and
        browsing behavior on our website, collected through cookies and similar technologies.
      </li>
      <li>
        <strong>Payment Information:</strong> If you make purchases through our website, we may collect
        payment details such as credit card numbers or other financial information. However, we do not store
        this information on our servers and use third-party payment processors to handle transactions
        securely.
      </li>
    </ul>

    <h2 className="text-xl font-bold mt-8 mb-3">Lawful Basis for Processing</h2>
    <p className="mb-3">We only process personal data when we have a lawful basis to do so, such as:</p>
    <ul className="list-disc pl-6 space-y-2">
      <li>
        <strong>Consent:</strong> When you voluntarily provide us with your personal data for specific
        purposes, such as subscribing to our magazine or newsletter, you consent to the processing of your
        information for those purposes.
      </li>
      <li>
        <strong>Contractual Necessity:</strong> When processing personal data is necessary for the
        performance of a contract, such as fulfilling your subscription or delivering purchased products.
      </li>
      <li>
        <strong>Legitimate Interests:</strong> When processing is necessary for our legitimate interests,
        such as improving our services, preventing fraud, and ensuring the security of our website and
        users.
      </li>
    </ul>

    <h2 className="text-xl font-bold mt-8 mb-3">Data Security</h2>
    <p>
      We implement appropriate technical and organizational measures to ensure the security of personal data
      and protect it from unauthorized access, disclosure, alteration, or destruction. These measures
      include encryption, access controls, and regular security assessments.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Data Retention</h2>
    <p>
      We retain personal data only for as long as necessary to fulfill the purposes for which it was
      collected, or as required by law. When personal data is no longer needed, we securely delete or
      anonymize it to prevent identification.
    </p>

    <h2 className="text-xl font-bold mt-8 mb-3">Your Rights</h2>
    <p className="mb-3">Under the GDPR, you have certain rights regarding your personal data, including:</p>
    <ul className="list-disc pl-6 space-y-2">
      <li>
        <strong>Right to Access:</strong> You have the right to request access to the personal data we hold
        about you and receive information about how it is processed.
      </li>
      <li>
        <strong>Right to Rectification:</strong> You have the right to request the correction of inaccurate
        or incomplete personal data.
      </li>
      <li>
        <strong>Right to Erasure:</strong> You have the right to request the deletion of your personal data
        under certain circumstances, such as when it is no longer necessary for the purposes for which it
        was collected.
      </li>
      <li>
        <strong>Right to Object:</strong> You have the right to object to the processing of your personal
        data in certain situations, such as for direct marketing purposes.
      </li>
      <li>
        <strong>Right to Data Portability:</strong> You have the right to receive a copy of your personal
        data in a structured, commonly used, and machine-readable format, and to transmit it to another
        controller.
      </li>
    </ul>

    <h2 className="text-xl font-bold mt-8 mb-3">Contact Us</h2>
    <p>
      If you have any questions or concerns about our GDPR Policy or our practices regarding your personal
      information, please contact us at{' '}
      <a href="mailto:grievance@thegreatindianews.com" className="text-brand-600 hover:underline">
        grievance@thegreatindianews.com
      </a>
      .
    </p>
  </StaticPage>
);

