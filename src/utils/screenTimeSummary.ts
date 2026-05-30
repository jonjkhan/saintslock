import type { ScreenTimeDiagnostics } from '../../modules/saintslock-screen-time/src';

export function getScreenTimeSelectionCount(diagnostics?: ScreenTimeDiagnostics | null) {
  if (!diagnostics) {
    return 0;
  }

  return (
    diagnostics.selectedApplicationTokenCount +
    diagnostics.selectedCategoryTokenCount +
    diagnostics.selectedWebDomainTokenCount
  );
}

function formatPart(count: number, singular: string, plural: string) {
  if (count <= 0) {
    return null;
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatScreenTimeSelectionSummary(
  diagnostics: ScreenTimeDiagnostics | null | undefined,
  verb: 'protected' | 'selected'
) {
  const total = getScreenTimeSelectionCount(diagnostics);
  if (total === 0) {
    return verb === 'protected' ? 'No apps protected yet' : 'No apps selected yet';
  }

  const parts = [
    formatPart(diagnostics?.selectedApplicationTokenCount ?? 0, 'app', 'apps'),
    formatPart(diagnostics?.selectedCategoryTokenCount ?? 0, 'category', 'categories'),
    formatPart(diagnostics?.selectedWebDomainTokenCount ?? 0, 'website', 'websites'),
  ].filter(Boolean);

  return `${parts.join(' + ')} ${verb}`;
}

export function formatScreenTimeShieldStatus(
  diagnostics: ScreenTimeDiagnostics | null | undefined,
  hasActiveUnlock: boolean
) {
  if (getScreenTimeSelectionCount(diagnostics) === 0) {
    return 'No apps protected yet';
  }

  if (hasActiveUnlock || !diagnostics?.isShieldApplied) {
    return 'Shielding paused';
  }

  return 'Shielding active';
}
