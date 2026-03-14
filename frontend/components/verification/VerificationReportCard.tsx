'use client';

import { VerificationReport, CriterionStatus, GigType } from '@/types';

interface VerificationReportCardProps {
  report: VerificationReport;
}

const verificationStatusIcons: Record<CriterionStatus, string> = {
  PASS: 'check-circle',
  PARTIAL: 'alert-circle',
  FAIL: 'x-circle',
  PENDING: 'clock',
};

const verificationStatusColors: Record<CriterionStatus, string> = {
  PASS: 'text-green-600',
  PARTIAL: 'text-amber-500',
  FAIL: 'text-red-600',
  PENDING: 'text-gray-500',
};

const paymentDecisionConfig = {
  AUTO_RELEASE: {
    label: 'Auto-Released',
    color: 'bg-green-100 text-green-800',
    icon: '💰',
  },
  HOLD: {
    label: 'On Hold',
    color: 'bg-amber-100 text-amber-800',
    icon: '⏸',
  },
  DISPUTE: {
    label: 'Under Dispute',
    color: 'bg-red-100 text-red-800',
    icon: '⚠️',
  },
};

export function VerificationReportCard({ report }: VerificationReportCardProps) {
  const paymentConfig = paymentDecisionConfig[report.payment_decision];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="border-b border-gray-100 p-4 rounded-tl-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              {paymentConfig.icon}
            </div>
            <div className={`text-lg font-bold ${paymentConfig.color} px-2 py-1 rounded`}>
              {paymentConfig.label}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-center text-3xl font-bold mb-2">
            {report.overall_score}
            <span className="text-gray-600 text-sm font-medium">/100</span>
          </h3>
          <p className="text-center text-gray-600 mb-6">
            {report.feedback_for_freelancer}
          </p>
        </div>

        <div className="border-t border-gray-100 rounded-b mt-6 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Verification Criteria
          </h4>
          <div className="space-y-4">
            {report.criteria.map((criterion, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 text-xl">
                  {criterion.status === 'PASS' ? '✅' : criterion.status === 'FAIL' ? '❌' : criterion.status === 'PARTIAL' ? '⚠️' : '⏳'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${verificationStatusColors[criterion.status]}`}>
                    {criterion.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {criterion.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {report.pfi_signals && report.pfi_signals.length > 0 && (
          <div className="bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg p-4 mt-6">
            <h4 className="text-lg font-semibold text-yellow-900 mb-4">
              PFI Signals (Quality Indicators)
            </h4>
            <div className="space-y-3">
              {report.pfi_signals.map((signal, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="text-yellow-600 font-medium">
                    {signal.name}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800">
                      {signal.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.resubmissions_remaining > 0 && (
          <div className="bg-blue-50 text-blue-800 border-t border-blue-200 rounded-b p-4 mt-6">
            <div className="flex items-center gap-2 text-blue-700">
              <span>Resubmissions remaining: {report.resubmissions_remaining}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
