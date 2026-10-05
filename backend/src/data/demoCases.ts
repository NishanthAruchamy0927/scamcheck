export interface DemoCase {
  id: string;
  title: string;
  category: string;
  badge: 'HIGH RISK' | 'LOW RISK' | 'NEEDS VERIFICATION';
  description: string;
  content: string;
}

export const DEMO_CASES: DemoCase[] = [
  {
    id: 'demo-1-impersonation-scam',
    title: 'Demo 1: Enterprise Impersonation Scam (TCS)',
    category: 'Impersonation Scam',
    badge: 'HIGH RISK',
    description: 'Major corporate brand claimed with public Gmail recruiter, ₹2,999 advance fee, 24h deadline, and Telegram routing.',
    content: `CONGRATULATIONS! YOU HAVE BEEN SELECTED!

Dear Candidate,
We are pleased to inform you that you have been directly shortlisted and selected for the position of Software Development & AI Intern at Tata Consultancy Services (TCS).

Internship Highlights:
- Role: AI & Python Development Intern
- Stipend: INR 45,000 per month
- Work Mode: Remote / Work From Home
- Duration: 3 Months

Important Instructions for Onboarding:
As per our campus hiring policy, all selected candidates must deposit a one-time refundable security and training fee of INR 2,999 towards your developer training kit and cloud credentials setup. This amount is 100% refundable with your first monthly stipend.

Required Documents for Immediate Dispatch:
Please upload your Aadhaar Card, PAN Card, and Bank Account Details for direct stipend setup.

DEADLINE: You must complete the registration fee payment within 24 hours of receiving this offer letter to reserve your slot. Only 3 slots left for this batch.

Payment & Verification:
Please contact our HR coordinator on Telegram: @TCS_Campus_Recruiter or reply with your payment receipt to hr.tcsinternships2026@gmail.com.

Best Regards,
Rajesh Sharma
Talent Acquisition Team
Tata Consultancy Services
Website: https://tcs.com`
  },
  {
    id: 'demo-2-legitimate-offer',
    title: 'Demo 2: Verified Enterprise Internship (Google)',
    category: 'Authentic Opportunity',
    badge: 'LOW RISK',
    description: 'Authentic enterprise internship through official ATS portal with standard coding assessments and $0 candidate fee.',
    content: `Google LLC — Software Engineering Internship (Summer 2026)

Position: Software Engineering Intern
Location: Bangalore, Karnataka, India / Hybrid
Application Requisition ID: #G-SWE-2026-IN

Thank you for your interest in joining Google. We are pleased to invite you to participate in our standard University Graduate Internship technical assessment process.

Selection Process & Interview Stages:
1. Online Coding Assessment (Google Assessment Platform)
2. Technical Interview Round 1 (Data Structures, Algorithms, Complexity Analysis)
3. Technical Interview Round 2 (System Design & Code Quality)
4. Hiring Manager & Team Matching Discussion

Compensation & Benefits:
- Monthly Stipend: INR 1,10,000 per month + standard corporate housing assistance
- Hardware: Enterprise MacBook Pro provisioned and shipped directly by Google IT at zero cost to the candidate.

Security & Equal Opportunity Notice:
Google is an Equal Opportunity Employer. Google NEVER requests application fees, security deposits, training charges, or processing money at any stage of the recruitment process. All official communications will originate exclusively from authenticated @google.com email domains.

To review your application status or schedule your coding assessment round, please log into your Google Careers Candidate Portal:
https://careers.google.com/applications/swe-intern-2026

Warm regards,
Ananya Sen
University Recruiting & Talent Operations
Google India Private Limited
Email: ananya.sen@google.com`
  },
  {
    id: 'demo-3-ambiguous-stealth',
    title: 'Demo 3: Ambiguous Stealth Startup Gig',
    category: 'Ambiguous Opportunity',
    badge: 'NEEDS VERIFICATION',
    description: 'Freelance gig with incomplete organization web footprint and personal email, but no immediate financial extortion.',
    content: `Hey there!
I saw your profile on GitHub and wanted to reach out regarding a fast-track project for our early-stage stealth startup, NexaCraft Studios.

We are looking for a freelance React & Node.js developer to help build our client landing page and dashboard over the next 3 weeks.
- Compensation: $400 for completing the milestone tasks.
- Timeline: Start next Monday.
- Communication: Slack or email.

Please reply to nexacraft.stealth@gmail.com with your portfolio links and let me know if you are available to take this up. We do not have a public website launched yet since we are in private beta.

Cheers,
Mark
Founder, NexaCraft Studios`
  },
  {
    id: 'demo-4-credential-theft',
    title: 'Demo 4: Credential & OTP Harvesting Fraud',
    category: 'Credential Scam',
    badge: 'HIGH RISK',
    description: 'Demands netbanking account password, OTP verification code, and UPI PIN under the guise of stipend bank transfer.',
    content: `DIRECT SALARY DISBURSEMENT NOTIFICATION — URGENT ACTION REQUIRED

Dear Student Intern,
Your monthly stipend of INR 35,000 has been processed by our automated payroll disbursement gateway.

To confirm the cryptographic release of funds to your personal bank account, bank compliance requires immediate two-factor verification.

Required Verification Steps:
1. Provide your registered netbanking user ID and temporary account login password.
2. Reply immediately with the 6-digit One-Time Password (OTP) sent to your registered phone number.
3. Verify your 6-digit UPI PIN via our direct portal.

WARNING: Failure to verify your OTP within 15 minutes will result in automatic cancellation of your internship placement and freezing of salary disbursement.

Payroll Verification Desk:
support.payroll-disbursement@fastmail.com`
  },
  {
    id: 'demo-5-contradictory-evidence',
    title: 'Demo 5: Contradictory Claims & Hidden Fee Fraud',
    category: 'Contradictory Evidence',
    badge: 'HIGH RISK',
    description: 'Opportunity states "100% Free & Zero Recruitment Charges", yet explicitly demands ₹2,999 advance registration fee on Telegram.',
    content: `INFOSYS CAMPUS HIRING 2026 — 100% FREE MERIT RECRUITMENT PROGRAM

NOTICE: In compliance with corporate ethics, this internship recruitment is 100% Free of charge with zero registration fees.

Role: Associate Software Developer
Stipend: ₹40,000 / month
Location: Remote / Work From Home

Candidate Selection Update:
Congratulations! Based on your resume, you have been selected directly with no interview required.

To activate your corporate login portal and receive your offer letter, please transfer a refundable security deposit of ₹2,999 to our verified account within 24 hours. Contact our coordinator on Telegram: @Infosys_Admin_Desk.`
  }
];
