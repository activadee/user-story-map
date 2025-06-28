import { Injectable } from '@angular/core';
import {
  ImportError,
  ImportErrorCode,
  ImportWarning,
  UserStoryMapSnapshot,
  ValidationResult,
} from '../interfaces/import-export.interface';

@Injectable({
  providedIn: 'root',
})
export class SchemaValidationService {
  validateUserStoryMapSnapshot(snapshot: unknown): ValidationResult {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    try {
      if (!this.isValidObject(snapshot)) {
        errors.push({
          code: ImportErrorCode.INVALID_SCHEMA,
          message: 'Invalid JSON format: expected object',
        });
        return { isValid: false, errors, warnings };
      }

      const data = snapshot as Record<string, unknown>;

      const requiredFields = ['version', 'metadata', 'data'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          errors.push({
            code: ImportErrorCode.MISSING_REQUIRED_FIELD,
            message: `Missing required field: ${field}`,
            field,
          });
        }
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      const schemaErrors = this.validateSchema(
        data as unknown as UserStoryMapSnapshot,
      );
      errors.push(...schemaErrors);

      if (errors.length === 0) {
        const refErrors = this.validateReferences(
          data as unknown as UserStoryMapSnapshot,
        );
        errors.push(...refErrors);
      }

      if (errors.length === 0) {
        const bizWarnings = this.validateBusinessRules(
          data as unknown as UserStoryMapSnapshot,
        );
        warnings.push(...bizWarnings);
      }
    } catch (error) {
      errors.push({
        code: ImportErrorCode.INVALID_SCHEMA,
        message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isValidObject(value: unknown): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private validateSchema(snapshot: UserStoryMapSnapshot): ImportError[] {
    const errors: ImportError[] = [];

    if (typeof snapshot.version !== 'string') {
      errors.push({
        code: ImportErrorCode.INVALID_SCHEMA,
        message: 'Version must be a string',
        field: 'version',
      });
    }

    if (!this.isValidObject(snapshot.metadata)) {
      errors.push({
        code: ImportErrorCode.INVALID_SCHEMA,
        message: 'Metadata must be an object',
        field: 'metadata',
      });
    } else {
      if (typeof snapshot.metadata.exportedAt !== 'string') {
        errors.push({
          code: ImportErrorCode.INVALID_SCHEMA,
          message: 'Metadata.exportedAt must be a string',
          field: 'metadata.exportedAt',
        });
      }
      if (snapshot.metadata.source !== 'user-story-map') {
        errors.push({
          code: ImportErrorCode.INVALID_SCHEMA,
          message: 'Invalid source. Expected "user-story-map"',
          field: 'metadata.source',
        });
      }
    }

    if (!this.isValidObject(snapshot.data)) {
      errors.push({
        code: ImportErrorCode.INVALID_SCHEMA,
        message: 'Data must be an object',
        field: 'data',
      });
    } else {
      const requiredDataFields = [
        'journeys',
        'issues',
        'releases',
        'assignments',
      ];
      for (const field of requiredDataFields) {
        if (
          !Array.isArray(snapshot.data[field as keyof typeof snapshot.data])
        ) {
          errors.push({
            code: ImportErrorCode.INVALID_SCHEMA,
            message: `Data.${field} must be an array`,
            field: `data.${field}`,
          });
        }
      }
    }

    return errors;
  }

  private validateReferences(snapshot: UserStoryMapSnapshot): ImportError[] {
    const errors: ImportError[] = [];
    const { journeys, issues } = snapshot.data;

    const stepIds = new Set();
    const releaseIds = new Set(snapshot.data.releases.map((r) => r.id));
    const issueIds = new Set(issues.map((i) => i.id));

    journeys.forEach((journey) => {
      if (journey.userSteps && Array.isArray(journey.userSteps)) {
        journey.userSteps.forEach((step) => {
          stepIds.add(step.id);
          if (step.journeyId !== journey.id) {
            errors.push({
              code: ImportErrorCode.INVALID_REFERENCE,
              message: `Step ${step.id} has invalid journeyId ${step.journeyId}`,
              field: 'userSteps.journeyId',
            });
          }
        });
      }
    });

    issues.forEach((issue) => {
      if (issue.assignedStepId && !stepIds.has(issue.assignedStepId)) {
        errors.push({
          code: ImportErrorCode.INVALID_REFERENCE,
          message: `Issue ${issue.id} assigned to non-existent step ${issue.assignedStepId}`,
          field: 'assignedStepId',
        });
      }

      if (issue.assignedReleaseId && !releaseIds.has(issue.assignedReleaseId)) {
        errors.push({
          code: ImportErrorCode.INVALID_REFERENCE,
          message: `Issue ${issue.id} assigned to non-existent release ${issue.assignedReleaseId}`,
          field: 'assignedReleaseId',
        });
      }
    });

    if (snapshot.data.assignments) {
      snapshot.data.assignments.forEach((assignment) => {
        if (!issueIds.has(assignment.issueId)) {
          errors.push({
            code: ImportErrorCode.INVALID_REFERENCE,
            message: `Assignment references non-existent issue ${assignment.issueId}`,
            field: 'assignments.issueId',
          });
        }
        if (!stepIds.has(assignment.stepId)) {
          errors.push({
            code: ImportErrorCode.INVALID_REFERENCE,
            message: `Assignment references non-existent step ${assignment.stepId}`,
            field: 'assignments.stepId',
          });
        }
      });
    }

    return errors;
  }

  private validateBusinessRules(
    snapshot: UserStoryMapSnapshot,
  ): ImportWarning[] {
    const warnings: ImportWarning[] = [];
    const { journeys, issues } = snapshot.data;

    const journeyOrders = journeys.map((j) => j.order);
    const duplicateJourneyOrders = journeyOrders.filter(
      (order, index) => journeyOrders.indexOf(order) !== index,
    );
    if (duplicateJourneyOrders.length > 0) {
      warnings.push({
        code: 'DUPLICATE_ORDER',
        message: 'Some journeys have duplicate order values',
        field: 'journeys.order',
      });
    }

    const unassignedIssues = issues.filter((i) => !i.assignedStepId);
    if (unassignedIssues.length > 0) {
      warnings.push({
        code: 'UNASSIGNED_ISSUES',
        message: `${unassignedIssues.length} issues are not assigned to any step`,
      });
    }

    const emptyJourneys = journeys.filter(
      (j) => !j.userSteps || j.userSteps.length === 0,
    );
    if (emptyJourneys.length > 0) {
      warnings.push({
        code: 'EMPTY_JOURNEYS',
        message: `${emptyJourneys.length} journeys have no steps`,
      });
    }

    return warnings;
  }
}
