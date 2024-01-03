export enum Category {
    null = null,
    Support = "Support",
    Fix = "Fix"
  }

export interface GPTTaskParameter {
    name: string;
    type: string;
    default: string;
    options: string[];
    required: boolean;
}

export enum Type {
  null = null,
  RDS = "RDS",
  SSH = "SSH"
}

export interface Connection {
  id: string;
  type: Type;
  name: string;
  host: string;
  username: string;
  password: string;
  logo: string;
}

export interface GPTTaskExecutionParameter {
  name: string;
  type: string;
  options: string[];
  required: boolean;
  value: string;
}

export interface GPTTaskExecution {
  id: string;
  start_date: Date;
  end_date: Date;
  status: string;
  parameters: GPTTaskExecutionParameter[];
  error: string;
  code_execution_result: string;
}
  
export interface GPTTask {
    id: string;
    category: Category;
    name: string;
    connection_id: string;
    connections_id: string[];
    prompt: string;
    code: string;
    modules: string[];
    logo: string;
    language: string;
    schedule: string;
    schedule_type: string;
    schedule_value: string;
    schedule_label: string;
    parameters: GPTTaskParameter[];
    executions: GPTTaskExecution[];
  }