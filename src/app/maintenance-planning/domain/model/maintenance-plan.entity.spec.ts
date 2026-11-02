import { MaintenancePlan } from './maintenance-plan.entity';

describe('MaintenancePlan', () => {
  const newPlan = () => new MaintenancePlan({
    id: 'plan-1', plantId: 'plant-1', assetId: 'asset-1', title: 'Inspection',
    tasks: 'Inspect bearings', frequencyDays: 30, nextDueDate: '2026-11-02',
    lastCompletedAt: null, active: true, technicianId: null, createdAt: null,
  });

  it('moves the next date forward by the plan frequency', () => {
    const plan = newPlan();
    plan.registerCompletion('2026-11-02');
    expect(plan.lastCompletedAt).toBe('2026-11-02');
    expect(plan.nextDueDate).toBe('2026-12-02');
  });

  it('keeps the original entity unchanged when a draft is completed', () => {
    const plan = newPlan();
    const draft = plan.clone();
    draft.registerCompletion('2026-11-02');
    expect(plan.lastCompletedAt).toBeNull();
    expect(draft.lastCompletedAt).toBe('2026-11-02');
  });
});
