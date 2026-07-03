import { useState } from 'react';
import { reviewLessorVerificationUseCase } from '../../data/di';
import { VerificationsException } from '../../domain/exceptions/VerificationsException';
import type { VerificationDecision } from '../../domain/objectvalues/VerificationDecision';

interface UseReviewVerificationState {
  review: (id: string, decision: VerificationDecision, comment: string, reasons: string[]) => Promise<boolean>;
  submitting: boolean;
  error: string | null;
}

export function useReviewVerification(): UseReviewVerificationState {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const review = async (
    id: string,
    decision: VerificationDecision,
    comment: string,
    reasons: string[],
  ): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      await reviewLessorVerificationUseCase.execute(id, decision, comment, reasons);
      return true;
    } catch (e) {
      setError(
        e instanceof VerificationsException
          ? e.message
          : 'Error inesperado al aplicar la decisión.',
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { review, submitting, error };
}
