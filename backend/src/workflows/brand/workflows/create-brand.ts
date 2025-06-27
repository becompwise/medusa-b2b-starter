// /src/workflows/brand/workflows/create-brand.ts
import { createBrandStep } from '../steps';
import {
  // ...
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';

// ...

type CreateBrandWorkflowInput = {
  name: string;
};

export const createBrandWorkflow = createWorkflow(
  'create-brand',
  (input: CreateBrandWorkflowInput) => {
    const brand = createBrandStep(input);

    return new WorkflowResponse(brand);
  }
);
