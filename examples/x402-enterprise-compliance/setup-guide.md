# Enterprise Compliance Setup Guide

Complete checklist for deploying x402 agents in a
regulated environment.

## 1. Install Sentinel SDK

```bash
npm install @x402sentinel/x402
```

## 2. Configure budget policies

Set per-agent limits that match your company's
spending approval matrix.

## 3. Connect Slack / PagerDuty

Go to sentinel.valeocash.com/dashboard/integrations

- Slack: real-time alerts for budget warnings
- PagerDuty: critical alerts for budget breaches (on-call)
- Email: daily digest for finance team

## 4. Schedule automated reports

Go to sentinel.valeocash.com/dashboard/settings/reports

- Weekly PDF report → finance@yourcompany.com (every Monday 9am)
- Monthly CSV export → accounting@yourcompany.com (1st of month)

## 5. Set up team roles

- Admin: engineering lead (full access)
- Viewer: finance team (read-only, export reports)
- Viewer: compliance team (read-only, verify receipts)

## 6. SOC 2 evidence package

When your auditor asks, export:
- PDF audit report (all transactions)
- Activity log CSV (all admin actions)
- Receipts page (cryptographic proof per payment)
- Budget policy screenshots
- Alert configuration screenshots

All available at sentinel.valeocash.com/dashboard

## 7. Ongoing monitoring

- Check custom dashboard daily (CFO View preset)
- Review weekly scheduled reports
- Investigate any PagerDuty alerts immediately
- Export quarterly audit reports for compliance filing
