import { WorkflowStep } from "./WorkflowStep";

export interface WorkflowData {
    name?: string
    defaults?: {
        "working-directory"?: string
        run?: {
            shell?: string
        }
    }
    jobs?: {
        name?: string
        defaults?: {
            "working-directory"?: string
            run?: {
                shell?: string
            }
        }
        env?: any
        steps?: WorkflowStep[]
    }
    env?: any
};
