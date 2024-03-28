import { IManagedPolicy, IRole, Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {Function}from "aws-cdk-lib/aws-lambda";
import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Code } from "aws-cdk-lib/aws-lambda";


export interface LambdaProps {
  readonly lambdaName: string;

  readonly lambdaDescription: string;

  readonly lambdaPath: string;

  readonly lambdaMemorySize?: number;

  readonly lambdaTimeOutSeconds?: number;

  readonly lambdaEnvironment?: { [key: string]: string };

  readonly runTime: lambda.Runtime;
  
  readonly role: IRole;
}

export class BaseLambda extends Construct {
  public role: Role;
  public function: Function;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    this.function = new Function(this, props.lambdaName, {
      functionName: props.lambdaName,
      description: props.lambdaDescription,
      code: Code.fromAsset(props.lambdaPath),
      handler: "lambda_function.lambda_handler",
      runtime: props.runTime,
      memorySize: props.lambdaMemorySize,
      timeout: Duration.seconds(props.lambdaTimeOutSeconds as number),
      role: props.role,
      environment: props.lambdaEnvironment,
    });

    new CfnOutput(this, "lambdaarn", {
      value: this.function.functionArn,
      description: "The arn of the lambda",
      exportName: props.lambdaName + "lambda-arn",
    });
  }
}
