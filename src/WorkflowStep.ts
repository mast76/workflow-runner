export interface WorkflowStep {
    name?: string;
    id?: string;
    shell?: string;
    env?: any;
    uses?: string;
    with?: any;
    run?: string;
    "working-directory"?: string;
    if?: string;
}
