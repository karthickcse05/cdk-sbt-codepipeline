#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodepipelineStack } from '../lib/codepipeline-stack';
import { S3Stack } from '../lib/s3-stack';
import { Tags } from 'aws-cdk-lib';

const app = new cdk.App();
const myaws = { account: app.node.tryGetContext("accountNumber"), region: app.node.tryGetContext("region") };
new CodepipelineStack(app, 'CodepipelineStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: myaws,
  description:"stack for cicd",

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

const s3_stack = new S3Stack(app, 'S3Stack', {
  env: myaws,
  description:"stack for S3 creation with event notification",
});
Tags.of(s3_stack).add("account", app.node.tryGetContext("accountNumber"));
Tags.of(s3_stack).add("region", app.node.tryGetContext("region"));
Tags.of(s3_stack).add("env", app.node.tryGetContext("env"));
Tags.of(s3_stack).add("org", app.node.tryGetContext("org"));